import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const frontendUrl =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_LOCAL;

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  email =
    process.env.NODE_ENV === "production"
      ? email
      : (process.env.RESEND_TEST_EMAIL as string);

  try {
    const data = await resend.emails.send({
      from: "ATA CRM <onboarding@resend.dev>",
      to: [email],
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
            }
            .content {
              line-height: 1.6;
            }
            .button-container {
              text-align: center;
              margin: 20px 0;
            }
            .button {
              background-color: #007bff;
              color: #fff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #888;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi,</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
              <p>Thanks,<br>The ATA CRM Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ATA CRM. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(data, "data...");
  } catch (error) {
    console.log(error, "Error...");
  }
};
