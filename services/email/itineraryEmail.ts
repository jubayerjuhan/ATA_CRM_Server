import { Resend } from "resend";
import { render } from "@react-email/render";
// import ItineraryEmail from "./templates/ItineraryEmailTemplate"; // Your React email component

const resend = new Resend("re_PqyvLBVb_9r8ZKb6T164gJkyCNkDgJf76");

export const sendItineraryEmail = async (
  email: string,
  lead: any,
  flights: any
) => {
  email =
    process.env.NODE_ENV === "production"
      ? email
      : (process.env.RESEND_TEST_EMAIL as string);

  const COMPANY_NAME = process.env.COMPANY_NAME
    ? process.env.COMPANY_NAME
    : "ATA CRM";

  // Render the email
};
