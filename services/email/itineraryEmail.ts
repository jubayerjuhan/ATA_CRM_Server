import { Resend } from "resend";
import { render } from "@react-email/render";
import ItineraryEmail from "./templates/ItineraryEmailTemplate"; // Your React email component
import React from "react";

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

  const htmlContent = await render(
    React.createElement(ItineraryEmail, {
      name: lead.firstName,
      company: COMPANY_NAME,
      flights,
      lead,
    })
  );

  try {
    // Send the email using Resend
    const data = await resend.emails.send({
      from: "ATA CRM <onboarding@resend.dev>",
      to: [email],
      subject: "Flight Itinerary",
      html: htmlContent,
    });
    console.log(data, "Email sending data");
  } catch (error: any) {
    console.error(error);
  }
};
