// Email utility - placeholder for future implementation
// Will integrate with email service (SendGrid, Mailgun, etc.)

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
    html: `<h1>Welcome, ${name}!</h1><p>Thank you for joining ${orgName}.</p>`,
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
    html: `<h1>Registration Confirmed</h1><p>Hi ${memberName},</p><p>You're registered for <strong>${eventTitle}</strong> on ${eventDate.toLocaleDateString()}.</p>`,
  };
}
