/**
 * Server-only mailer for the Fplaces website.
 *
 * This module reads SMTP credentials from server-side environment variables
 * and must never be imported from a client component. The values live in
 * .env.local (server only) and are never inlined into the bundle.
 */

import nodemailer, { type Transporter } from "nodemailer";

const FROM_DISPLAY_NAME = "Fplaces Website";

const REQUIRED_ENV_VARS = [
  "ZOHO_SMTP_HOST",
  "ZOHO_SMTP_PORT",
  "ZOHO_SMTP_USER",
  "ZOHO_SMTP_PASS",
  "MAIL_FROM_ADDRESS",
  "CONTACT_TO_EMAILS",
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

/**
 * Checks every required variable up front and reports the first missing one.
 * The error names the variable only, never its value.
 */
function assertMailConfig(): void {
  for (const name of REQUIRED_ENV_VARS) {
    const value = process.env[name];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }
}

/**
 * Reads a required environment variable.
 * Throws an error naming only the variable, never its value.
 */
function requireEnv(name: RequiredEnvVar): string {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function requirePort(name: RequiredEnvVar): number {
  const raw = requireEnv(name);
  const port = Number.parseInt(raw, 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid value for environment variable: ${name}`);
  }

  return port;
}

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (transporter) return transporter;

  const host = requireEnv("ZOHO_SMTP_HOST");
  const port = requirePort("ZOHO_SMTP_PORT");
  const user = requireEnv("ZOHO_SMTP_USER");
  const pass = requireEnv("ZOHO_SMTP_PASS");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

/** Parses the comma separated CONTACT_TO_EMAILS list into addresses. */
function getRecipients(): string[] {
  return requireEnv("CONTACT_TO_EMAILS")
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.length > 0);
}

export type SendMailInput = {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/**
 * Sends an email from MAIL_FROM_ADDRESS to the CONTACT_TO_EMAILS list.
 * The optional replyTo is the visitor address, so replying lands in their inbox.
 */
export async function sendMail({ subject, text, html, replyTo }: SendMailInput) {
  assertMailConfig();

  const from = requireEnv("MAIL_FROM_ADDRESS");
  const to = getRecipients();

  if (to.length === 0) {
    throw new Error("Missing required environment variable: CONTACT_TO_EMAILS");
  }

  return getTransport().sendMail({
    from: `"${FROM_DISPLAY_NAME}" <${from}>`,
    to,
    subject,
    text,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

/**
 * Turns an unknown error into a log-safe message.
 * Anything that looks like a credential is redacted before it is written out.
 */
export function describeMailError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  let safe = raw;

  for (const name of ["ZOHO_SMTP_PASS", "ZOHO_SMTP_USER"] as const) {
    const value = process.env[name];
    if (value && value.length > 2) {
      safe = safe.split(value).join("[redacted]");
    }
  }

  return safe;
}
