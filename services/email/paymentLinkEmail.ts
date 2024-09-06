import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const frontendUrl =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_LOCAL;

interface PaymentDetails {
  amount: number;
  currency: string;
  paymentLink: string;
  expiryDate?: string;
}

export const sendPaymentLinkEmail = async (
  email: string,
  customerName: string,
  paymentDetails: PaymentDetails
) => {
  // Use test email in non-production environments
  email =
    process.env.NODE_ENV === "production"
      ? email
      : (process.env.RESEND_TEST_EMAIL as string);

  try {
    const data = await resend.emails.send({
      from: "ATA Airlines <onboarding@resend.dev>",
      to: [email],
      subject: `Payment Link for Your Booking`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Link for Your Booking</title>
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
            border-bottom: 1px solid #eee;
        }
        .header h1 {
            margin: 0;
            color: #007bff;
        }
        .content {
            line-height: 1.6;
        }
        .payment-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .payment-amount {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
            text-align: center;
            margin: 20px 0;
        }
        .payment-link {
            text-align: center;
            margin: 30px 0;
        }
        .payment-link a {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #888;
            margin-top: 20px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Link for Your Booking</h1>
        </div>
        <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for choosing ATA Airlines. To complete your booking, please use the payment link below:</p>
            <div class="payment-amount">
                Amount Due: ${paymentDetails.amount} ${paymentDetails.currency}
            </div>
            <div class="payment-details">
                <p><strong>Currency:</strong> ${paymentDetails.currency}</p>
                ${
                  paymentDetails.expiryDate
                    ? `<p><strong>Expires On:</strong> ${paymentDetails.expiryDate}</p>`
                    : ""
                }
            </div>
            <div class="payment-link">
                <a href="${
                  paymentDetails.paymentLink
                }" target="_blank">Click Here to Pay</a>
            </div>
            <p>Please complete the payment to confirm your booking. If you have any questions, please don't hesitate to contact our customer support.</p>
            <p>We look forward to serving you!</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 ATA Airlines. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
      `,
    });

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
