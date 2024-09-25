import { Resend } from "resend";
import { render } from "@react-email/render";
import ItineraryEmail from "./templates/ItineraryEmailTemplate"; // Your React email component
import React from "react";

const resend = new Resend("re_PqyvLBVb_9r8ZKb6T164gJkyCNkDgJf76");

export const sendItineraryEmail = async (email: string) => {
  // please make a demo lead

  email = "dropshipninja23@gmail.com";
  const lead = {
    name: "John Doe",
    confirmationNumber: "123456",
    date: "2022-01-01",
    flightNumber: "123",
    departureTime: "09:00",
    departureCity: "LAX",
    arrivalTime: "12:00",
    arrivalCity: "JFK",
    seatNumber: "1A",
    duration: "3 hours",
    aircraftType: "Boeing 737",
  };

  const htmlContent = await render(
    React.createElement(ItineraryEmail, {
      name: lead.name,
      airline: "Your Airline",
      confirmationNumber: lead.confirmationNumber,
      date: lead.date,
      flightNumber: lead.flightNumber,
      departureTime: lead.departureTime,
      departureCity: lead.departureCity,
      arrivalTime: lead.arrivalTime,
      arrivalCity: lead.arrivalCity,
      seatNumber: lead.seatNumber,
      duration: lead.duration,
      aircraftType: lead.aircraftType,
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
