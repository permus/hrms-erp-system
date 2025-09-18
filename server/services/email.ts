import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
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

export function createInvitationEmail(companyName: string, adminName: string, email: string, tempPassword: string, companySlug: string): EmailParams {
  const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
  const loginUrl = `${baseUrl}/${companySlug}/dashboard`;
  
  const subject = `Welcome to ${companyName} - Your Admin Access`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to ${companyName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .credentials { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to ${companyName}!</h1>
        </div>
        
        <div class="content">
            <p>Hello ${adminName},</p>
            
            <p>Congratulations! Your company account has been successfully created on our ERP/HRMS platform. You have been assigned as the Company Administrator with full access to manage your organization.</p>
            
            <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
                <p><strong>Company Portal:</strong> ${companySlug}</p>
            </div>
            
            <p>Click the button below to access your company dashboard:</p>
            
            <a href="${loginUrl}" class="button">Access Your Dashboard</a>
            
            <p><strong>Important Security Notes:</strong></p>
            <ul>
                <li>Please change your password after your first login</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>Contact support if you experience any issues accessing your account</li>
            </ul>
            
            <p>As a Company Administrator, you can:</p>
            <ul>
                <li>Manage employee records and onboarding</li>
                <li>Configure HR policies and workflows</li>
                <li>Access payroll and finance modules</li>
                <li>Generate reports and analytics</li>
                <li>Invite additional users and assign roles</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Welcome aboard!</p>
            <p>The ERP/HRMS Platform Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you did not expect this invitation, please contact our support team immediately.</p>
        </div>
    </body>
    </html>
  `;
  
  const text = `
Welcome to ${companyName}!

Hello ${adminName},

Your company account has been successfully created. You have been assigned as Company Administrator.

Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}
Company Portal: ${companySlug}

Access your dashboard: ${loginUrl}

Important:
- Please change your password after first login
- Keep your credentials secure
- Contact support if you need assistance

Welcome aboard!
The ERP/HRMS Platform Team
  `;

  return {
    to: email,
    from: 'test@example.com', // Use a simple test sender for now
    subject,
    text,
    html
  };
}