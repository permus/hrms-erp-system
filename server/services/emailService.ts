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

export async function sendCompanyAdminInvitation(
  adminEmail: string,
  companyName: string,
  tempPassword: string,
  signinUrl: string
): Promise<boolean> {
  const subject = `Your ${companyName} Admin Account - ERP/HRMS System`;
  
  const text = `Welcome to the ${companyName} ERP/HRMS System!

You have been created as a Company Administrator for ${companyName}.

Your login credentials:
Email: ${adminEmail}
Temporary Password: ${tempPassword}

Please sign in at: ${signinUrl}

IMPORTANT: You will be required to change your password upon first login for security.

If you have any questions, please contact your system administrator.

Best regards,
ERP/HRMS System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to ${companyName} ERP/HRMS System!</h2>
      
      <p>You have been created as a <strong>Company Administrator</strong> for <strong>${companyName}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${adminEmail}</p>
        <p><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
      </div>
      
      <p>
        <a href="${signinUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Sign In to Your Account
        </a>
      </p>
      
      <div style="background-color: #fef3cd; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;"><strong>IMPORTANT:</strong> You will be required to change your password upon first login for security.</p>
      </div>
      
      <p>If you have any questions, please contact your system administrator.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        ERP/HRMS System
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    from: 'noreply@erp-system.com', // You may want to configure this
    subject,
    text,
    html
  });
}