/**
 * Shared, dependency-free validation helpers.
 *
 * These are plain functions so the same rules can run on the server (route
 * handlers) and on the client (inline field errors) without pulling in a
 * schema library.
 */

export const CONTACT_FIELDS = [
  "name",
  "email",
  "venueName",
  "venueType",
  "message",
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  venueNameMax: 200,
  venueTypeMax: 100,
  messageMax: 2000,
} as const;

/** Trims a value into a plain string, treating anything non-string as empty. */
export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/** Removes CR/LF so free text can never break out of a mail header. */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type ContactInput = {
  name: string;
  email: string;
  venueName: string;
  venueType: string;
  message: string;
};

export type ValidatedContact = {
  name: string;
  email: string;
  venueName: string;
  venueType: string;
  message: string;
};

/**
 * Validates the venue contact form payload.
 * Every value is trimmed before it is checked.
 */
export function validateContact(
  payload: Record<string, unknown>,
): { ok: true; data: ValidatedContact } | { ok: false; errors: FieldErrors<ContactField> } {
  const errors: FieldErrors<ContactField> = {};

  const name = cleanText(payload.name);
  const email = cleanText(payload.email);
  const venueName = cleanText(payload.venueName);
  const venueType = cleanText(payload.venueType);
  const message = cleanText(payload.message);

  if (name.length < LIMITS.nameMin) {
    errors.name = "Please enter your full name.";
  } else if (name.length > LIMITS.nameMax) {
    errors.name = `Name must be ${LIMITS.nameMax} characters or fewer.`;
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!venueName) {
    errors.venueName = "Please enter your venue name.";
  } else if (venueName.length > LIMITS.venueNameMax) {
    errors.venueName = `Venue name must be ${LIMITS.venueNameMax} characters or fewer.`;
  }

  if (!venueType) {
    errors.venueType = "Please choose a venue type.";
  } else if (venueType.length > LIMITS.venueTypeMax) {
    errors.venueType = `Venue type must be ${LIMITS.venueTypeMax} characters or fewer.`;
  }

  if (!message) {
    errors.message = "Please tell us about your venue.";
  } else if (message.length > LIMITS.messageMax) {
    errors.message = `Message must be ${LIMITS.messageMax} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { name, email, venueName, venueType, message },
  };
}

export type SubscribeInput = { email: string };

/** Validates the newsletter subscribe payload. Only an email is required. */
export function validateSubscribe(
  payload: Record<string, unknown>,
): { ok: true; data: SubscribeInput } | { ok: false; errors: FieldErrors<"email"> } {
  const errors: FieldErrors<"email"> = {};
  const email = cleanText(payload.email);

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: { email } };
}
