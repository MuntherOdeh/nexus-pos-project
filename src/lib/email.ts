import { Resend } from 'resend';

interface ContactEmailData {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Get admin recipients from environment or use defaults
const getAdminRecipients = (): string[] => {
  const envRecipients = process.env.ADMIN_EMAIL_RECIPIENTS;
  if (envRecipients) {
    return envRecipients.split(',').map(email => email.trim());
  }
  // Default recipients - add your personal email here that works with Resend
  return [
    'abdullah.alali@scopecode.ae',
    'sales@scopecode.ae',
  ];
};

// Send contact form notification to admin
export async function sendContactNotification(data: ContactEmailData): Promise<boolean> {
  const startTime = Date.now();

  try {
    console.log('Starting email send process with Resend...');

    const recipients = getAdminRecipients();
    const fromEmail = process.env.RESEND_FROM || 'ScopeCode <noreply@scopecode.ae>';

    console.log('Sending to:', recipients.join(', '));
    console.log('From:', fromEmail);

    // Email to admin
    const { data: adminResult, error: adminError } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      replyTo: data.email,
      subject: `New Contact Form: ${data.subject}`,
      html: getAdminEmailHtml(data),
      text: getAdminEmailText(data),
    });

    if (adminError) {
      console.error('Failed to send admin email:', adminError);
      return false;
    }

    console.log('Admin email sent:', adminResult?.id);

    // Send confirmation email to the user
    const { data: userResult, error: userError } = await resend.emails.send({
      from: fromEmail,
      to: [data.email],
      subject: `Thank you for contacting ScopeCode`,
      html: getUserEmailHtml(data),
      text: getUserEmailText(data),
    });

    if (userError) {
      console.error('Failed to send user confirmation email:', userError);
      // Don't return false here - admin email was sent successfully
    } else {
      console.log('User confirmation email sent:', userResult?.id);
    }

    console.log(`Email process completed in ${Date.now() - startTime}ms`);

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Failed to send contact notification email:', {
      error: errorMessage,
      stack: errorStack,
      duration: `${Date.now() - startTime}ms`,
    });

    return false;
  }
}

// Verify Resend API connection - useful for debugging
export async function verifySmtpConnection(): Promise<{
  success: boolean;
  error?: string;
  config?: { provider: string; apiKeySet: boolean };
}> {
  try {
    console.log('Testing Resend API connection...');

    const apiKeySet = !!process.env.RESEND_API_KEY;

    if (!apiKeySet) {
      return {
        success: false,
        error: 'RESEND_API_KEY is not set',
        config: { provider: 'Resend', apiKeySet: false },
      };
    }

    console.log('Resend API key is configured');

    return {
      success: true,
      config: { provider: 'Resend', apiKeySet: true },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Resend API verification failed:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      config: { provider: 'Resend', apiKeySet: !!process.env.RESEND_API_KEY },
    };
  }
}

// HTML template for admin notification
function getAdminEmailHtml(data: ContactEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                    New Contact Form Submission
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #52525b; font-size: 16px; margin: 0 0 25px 0;">
                    You have received a new message from the ScopeCode website contact form.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                        <strong style="color: #0066cc; font-size: 14px;">Name:</strong>
                        <p style="color: #18181b; font-size: 16px; margin: 5px 0 0 0;">${escapeHtml(data.name)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                        <strong style="color: #0066cc; font-size: 14px;">Email:</strong>
                        <p style="color: #18181b; font-size: 16px; margin: 5px 0 0 0;">
                          <a href="mailto:${escapeHtml(data.email)}" style="color: #0066cc; text-decoration: none;">${escapeHtml(data.email)}</a>
                        </p>
                      </td>
                    </tr>
                    ${data.phone ? `
                    <tr>
                      <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                        <strong style="color: #0066cc; font-size: 14px;">Phone:</strong>
                        <p style="color: #18181b; font-size: 16px; margin: 5px 0 0 0;">
                          <a href="tel:${escapeHtml(data.phone)}" style="color: #0066cc; text-decoration: none;">${escapeHtml(data.phone)}</a>
                        </p>
                      </td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 12px 20px;">
                        <strong style="color: #0066cc; font-size: 14px;">Subject:</strong>
                        <p style="color: #18181b; font-size: 16px; margin: 5px 0 0 0;">${escapeHtml(data.subject)}</p>
                      </td>
                    </tr>
                  </table>
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid #0066cc;">
                    <strong style="color: #0066cc; font-size: 14px; display: block; margin-bottom: 10px;">Message:</strong>
                    <p style="color: #18181b; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                    <tr>
                      <td align="center">
                        <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${escapeHtml(data.subject)}"
                           style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Reply to ${escapeHtml(data.name)}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #71717a; font-size: 14px; margin: 0;">
                    This email was sent from the ScopeCode website contact form.
                  </p>
                  <p style="color: #a1a1aa; font-size: 12px; margin: 10px 0 0 0;">
                    &copy; ${new Date().getFullYear()} ScopeCode. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Plain text for admin notification
function getAdminEmailText(data: ContactEmailData): string {
  return `
New Contact Form Submission
============================

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
Subject: ${data.subject}

Message:
${data.message}

---
This email was sent from the ScopeCode website contact form.
  `.trim();
}

// HTML template for user confirmation
function getUserEmailHtml(data: ContactEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting Us</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                    Thank You for Contacting Us!
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #18181b; font-size: 18px; margin: 0 0 20px 0;">
                    Dear ${escapeHtml(data.name)},
                  </p>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Thank you for reaching out to ScopeCode. We have received your message and our team will review it shortly.
                  </p>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    We typically respond within <strong>24 hours</strong> during business days. If your inquiry is urgent, please feel free to call us directly.
                  </p>
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid #0066cc; margin-bottom: 30px;">
                    <strong style="color: #0066cc; font-size: 14px; display: block; margin-bottom: 10px;">Your Message Summary:</strong>
                    <p style="color: #52525b; font-size: 14px; margin: 0;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <p style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Need immediate assistance?</p>
                        <p style="color: #52525b; font-size: 14px; margin: 0 0 8px 0;">
                          Email: <a href="mailto:sales@scopecode.ae" style="color: #0066cc; text-decoration: none;">sales@scopecode.ae</a>
                        </p>
                        <p style="color: #52525b; font-size: 14px; margin: 0;">
                          Phone: <a href="tel:+971567814747" style="color: #0066cc; text-decoration: none;">+971 56 781 4747</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #71717a; font-size: 14px; margin: 0 0 10px 0;">
                    Best regards,<br>
                    <strong style="color: #18181b;">The ScopeCode Team</strong>
                  </p>
                  <p style="color: #a1a1aa; font-size: 12px; margin: 10px 0 0 0;">
                    &copy; ${new Date().getFullYear()} ScopeCode. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Plain text for user confirmation
function getUserEmailText(data: ContactEmailData): string {
  return `
Dear ${data.name},

Thank you for reaching out to ScopeCode. We have received your message and our team will review it shortly.

We typically respond within 24 hours during business days.

Your Message Summary:
Subject: ${data.subject}

Need immediate assistance?
Email: sales@scopecode.ae
Phone: +971 56 781 4747

Best regards,
The ScopeCode Team

© ${new Date().getFullYear()} ScopeCode. All rights reserved.
  `.trim();
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
