import axios from "axios";
import { Resend } from "resend";

const API_KEY = process.env.BREVO_API_KEY as string;

const frontendUrl =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_LOCAL;

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
) => {
  const emailData = {
    sender: {
      name: "Airways Travel",
      email: "info@airwaystravel.com.au",
    },
    to: [
      {
        email: email,
      },
    ],
    cc: [
      {
        email: "tech@airwaystravel.com.au",
      },
    ],
    subject: "Password Reset Request",
    htmlContent: `
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
              <p>Thanks,<br>Airways Travel Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ATA CRM. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
  };

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          accept: "application/json",
          "api-key": API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log("Email sent successfully. MessageId:", response, email);
  } catch (error: any) {
    console.error(
      "Error sending email:",
      error.response ? error.response.data : error.message
    );
  }
};
