// Email utility - placeholder for future implementation
// Will integrate with email service (SendGrid, Mailgun, etc.)

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implement email sending
  // For MVP, just log the email
  console.log("📧 Email would be sent:", {
    to: options.to,
    subject: options.subject,
  });
  return true;
}

export function buildWelcomeEmail(name: string, orgName: string): EmailOptions {
  return {
    to: "",
    subject: `Welcome to ${orgName}`,
    html: `<h1>Welcome, ${escapeHtml(name)}!</h1><p>Thank you for joining ${escapeHtml(orgName)}.</p>`,
  };
}

export function buildRegistrationConfirmation(
  memberName: string,
  eventTitle: string,
  eventDate: Date
): EmailOptions {
  return {
    to: "",
    subject: `Registration Confirmed: ${eventTitle}`,
    html: `<h1>Registration Confirmed</h1><p>Hi ${escapeHtml(memberName)},</p><p>You're registered for <strong>${escapeHtml(eventTitle)}</strong> on ${eventDate.toLocaleDateString()}.</p>`,
  };
}
