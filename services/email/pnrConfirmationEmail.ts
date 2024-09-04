import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const frontendUrl =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_LOCAL;

interface FlightDetails {
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
}

export const sendTicketConfirmationEmail = async (
  email: string,
  pnr: string,
  passengerName: string,
  flightDetails: FlightDetails
) => {
  // Use test email in non-production environments
  email =
    process.env.NODE_ENV === "production"
      ? (process.env.RESEND_TEST_EMAIL as string)
      : (process.env.RESEND_TEST_EMAIL as string);

  try {
    const data = await resend.emails.send({
      from: "ATA Airlines <onboarding@resend.dev>",
      to: [email],
      subject: `Booking Confirmation - PNR: ${pnr}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Flight Booking Confirmation</title>
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
            .flight-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .pnr {
              font-size: 24px;
              font-weight: bold;
              color: #28a745;
              text-align: center;
              margin: 20px 0;
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
              <h1>Flight Booking Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear ${passengerName},</p>
              <p>Your flight booking has been confirmed. Here are the details:</p>
              <div class="pnr">
                PNR: ${pnr}
              </div>
              <div class="flight-details">
                <p><strong>From:</strong> ${flightDetails.departureCity}</p>
                <p><strong>To:</strong> ${flightDetails.arrivalCity}</p>
                <p><strong>Date:</strong> ${flightDetails.departureDate}</p>
              </div>
              <p>Please arrive at the airport at least 2 hours before your scheduled departure time.</p>
              <p>We wish you a pleasant journey!</p>
              <p>Thank you for choosing ATA Airlines.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ATA Airlines. All rights reserved.</p>
              <p>For any queries, please contact our customer support.</p>
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
