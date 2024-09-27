import { Resend } from "resend";
import { render } from "@react-email/render";
import ItineraryEmail from "./templates/ItineraryEmailTemplate"; // Your React email component
import React from "react";
import PaymentEmailTemplate from "./templates/PaymentLinkEmailTemplate";

const resend = new Resend("re_PqyvLBVb_9r8ZKb6T164gJkyCNkDgJf76");

export const sendPaymentMethodSelectorEmail = async (lead: any) => {
  const email =
    process.env.NODE_ENV === "production"
      ? lead.email
      : (process.env.RESEND_TEST_EMAIL as string);

  const COMPANY_NAME = process.env.COMPANY_NAME
    ? process.env.COMPANY_NAME
    : "ATA CRM";

  console.log(lead, "Lead in payment method selector email");

  const htmlContent = await render(
    React.createElement(PaymentEmailTemplate, {
      name: lead.firstName,
      company: COMPANY_NAME,
      lead: lead,
    })
  );

  try {
    // Send the email using Resend
    const data = await resend.emails.send({
      from: "ATA CRM <onboarding@resend.dev>",
      to: [email],
      subject: "Payment Method Selection",
      html: htmlContent,
    });
    console.log(data, "Email sending data");
  } catch (error: any) {
    console.error(error);
  }
};
