import { describeMailError, sendMail } from "@/lib/mailer";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { escapeHtml, validateSubscribe } from "@/lib/validation";

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

  const result = validateSubscribe(body);

  if (!result.ok) {
    return Response.json(
      { error: "Please check the highlighted fields.", errors: result.errors },
      { status: 400 },
    );
  }

  const { email } = result.data;
  const subject = `New subscriber: ${email}`;

  const text = [
    "New subscriber from the Fplaces website.",
    "",
    `Email: ${email}`,
  ].join("\n");

  const html = `
    <h2 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#041315;">
      New subscriber
    </h2>
    <table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#08262a;line-height:1.5;">
      <tr>
        <td style="padding:4px 16px 4px 0;vertical-align:top;color:#5c5b59;">Email</td>
        <td style="padding:4px 0;vertical-align:top;">${escapeHtml(email)}</td>
      </tr>
    </table>
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
    console.error("Subscribe email failed:", describeMailError(error));
    return Response.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  // There is no database: the notification email is the subscriber record.
  return Response.json({ ok: true });
}
