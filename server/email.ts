import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not provided - email functionality will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email would be sent to:', params.to);
    console.log('Subject:', params.subject);
    console.log('Content:', params.text || params.html);
    return true; // Simulate success for development
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePasswordResetEmail(resetLink: string, firstName: string): { text: string; html: string } {
  const text = `
Hello ${firstName},

We received a request to reset your password for your AttendanceTracker Pro account.

Click the link below to reset your password:
${resetLink}

If you didn't request this password reset, please ignore this email.

The link will expire in 1 hour for security reasons.

Best regards,
AttendanceTracker Pro Team
  `;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">AttendanceTracker Pro</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0;">Password Reset Request</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
    <h2 style="color: #374151; margin-top: 0;">Hello ${firstName},</h2>
    
    <p style="color: #6b7280; line-height: 1.6;">
      We received a request to reset your password for your AttendanceTracker Pro account.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold;
                display: inline-block;">
        Reset Your Password
      </a>
    </div>
    
    <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
      If you didn't request this password reset, please ignore this email.
      The link will expire in 1 hour for security reasons.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
      <span style="word-break: break-all;">${resetLink}</span>
    </p>
  </div>
</div>
  `;

  return { text, html };
}