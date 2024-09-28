import { Resend } from "resend";
import { render } from "@react-email/render";
import brevo from "@getbrevo/brevo";
import moment from "moment";
import axios from "axios";

const API_KEY = process.env.BREVO_API_KEY as string;
const API_URL = "https://api.sendinblue.com/v3/smtp/email";

export const sendItineraryEmail = async (
  email: string,
  name: string,
  leadId: string,
  flights: any
) => {
  const COMPANY_NAME = process.env.COMPANY_NAME
    ? process.env.COMPANY_NAME
    : "ATA CRM Company";

  // Flight data
  flights.forEach((flight: any) => {
    flight.flt.departure.string = moment(flight.flt.departure.string).format(
      "DD MMMM YYYY [at] h:mm A"
    );
    flight.flt.arrival.string = moment(flight.flt.arrival.string).format(
      "DD MMMM YYYY [at] h:mm A"
    );
  });

  const data = {
    to: [{ email }],
    templateId: 9, // Replace with your actual template ID
    params: {
      company: COMPANY_NAME,
      firstName: name,
      flights: flights,
      leadId: leadId,
    },
  };

  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
  };

  //Calling the Api to send the email
  try {
    const response = await axios.post(API_URL, data, config);
    console.log("Email sent successfully. MessageId:", response.data.messageId);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error sending email:",
      error.response ? error.response.data : error.message
    );
  }
};
