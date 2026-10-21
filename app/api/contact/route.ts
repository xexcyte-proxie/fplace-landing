import { describeMailError, sendMail } from "@/lib/mailer";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { escapeHtml, singleLine, validateContact } from "@/lib/validation";

// Runs on the Node.js runtime (the default in Next.js 16). The "runtime"
// route segment config is rejected while next.config.ts enables
// cacheComponents, so it is intentionally not set here.

const GENERIC_ERROR = "Something went wrong, please try again or email us directly.";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;

  if (isRateLimited(getClientIp(request))) {
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  // Honeypot: a hidden field that only automated submissions fill in.
  // Answer as if it worked, but never send anything.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const result = validateContact(body);

  if (!result.ok) {
    return Response.json(
      { error: "Please check the highlighted fields.", errors: result.errors },
      { status: 400 },
    );
  }

  const { name, email, venueName, venueType, message } = result.data;
  const subject = `New venue enquiry: ${singleLine(name)}`;

  const text = [
    "New venue enquiry from the Fplaces website.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Venue name: ${venueName}`,
    `Venue type: ${venueType}`,
    "",
    "Message:",
    message,
    "",
    "Reply to this email to answer the sender directly.",
  ].join("\n");

  const html = `
    <h2 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#041315;">
      New venue enquiry
    </h2>
    <table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#08262a;line-height:1.5;">
      <tr>
        <td style="padding:4px 16px 4px 0;vertical-align:top;color:#5c5b59;">Name</td>
        <td style="padding:4px 0;vertical-align:top;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:4px 16px 4px 0;vertical-align:top;color:#5c5b59;">Email</td>
        <td style="padding:4px 0;vertical-align:top;">${escapeHtml(email)}</td>
      </tr>
      <tr>
        <td style="padding:4px 16px 4px 0;vertical-align:top;color:#5c5b59;">Venue name</td>
        <td style="padding:4px 0;vertical-align:top;">${escapeHtml(venueName)}</td>
      </tr>
      <tr>
        <td style="padding:4px 16px 4px 0;vertical-align:top;color:#5c5b59;">Venue type</td>
        <td style="padding:4px 0;vertical-align:top;">${escapeHtml(venueType)}</td>
      </tr>
      <tr>
        <td style="padding:4px 16px 4px 0;vertical-align:top;color:#5c5b59;">Message</td>
        <td style="padding:4px 0;vertical-align:top;white-space:pre-wrap;">${escapeHtml(message)}</td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#5c5b59;">
      Reply to this email to answer the sender directly.
    </p>
  `;

  try {
    await sendMail({
      subject,
      text,
      html,
      replyTo: email,
    });
  } catch (error) {
    // Only the error message is logged, never credentials.
    console.error("Contact form email failed:", describeMailError(error));
    return Response.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  return Response.json({ ok: true });
}
