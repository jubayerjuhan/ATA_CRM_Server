import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
} from "@react-email/components";
import { CSSProperties } from "react";

interface ItineraryEmailProps {
  name: string;
  airline: string;
  confirmationNumber: string;
  date: string;
  flightNumber: string;
  departureTime: string;
  departureCity: string;
  arrivalTime: string;
  arrivalCity: string;
  seatNumber: string;
  duration: string;
  aircraftType: string;
}

const ItineraryEmail = ({
  name,
  airline,
  confirmationNumber,
  date,
  flightNumber,
  departureTime,
  departureCity,
  arrivalTime,
  arrivalCity,
  seatNumber,
  duration,
  aircraftType,
}: ItineraryEmailProps) => (
  <Html>
    <Head />
    <Preview>Flight Itinerary for {name}</Preview>
    <Body style={mainStyle}>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Text style={logoStyle}>AIRLINE</Text>
          <Text>Flight Itinerary for {name}</Text>
        </Section>

        <Section style={sectionStyle}>
          <Heading as="h2">Thank you for choosing {airline}.</Heading>
          <Text>Your reservation is confirmed.</Text>
          <Text>Confirmation Number: {confirmationNumber}</Text>
        </Section>

        <Section style={flightContainerStyle}>
          <table role="presentation" width="100%">
            <tr>
              <td style={dateStyle}>{date}</td>
              <td style={alignRightStyle}>Flight: {flightNumber}</td>
            </tr>
          </table>

          <table
            role="presentation"
            width="100%"
            style={flightDetailsTableStyle}
          >
            <tr>
              <td style={detailsStyle}>
                <Text style={timeStyle}>{departureTime}</Text>
                <Text style={{ marginBottom: "0px" }}>{departureCity}</Text>
              </td>
              <td style={detailsStyle}>
                <Text style={timeStyle}>{arrivalTime}</Text>
                <Text style={{ marginBottom: "0px" }}>{arrivalCity}</Text>
              </td>
            </tr>
          </table>

          <div>
            <Text>Seat Assignment: {seatNumber}</Text>
            <Text>Travel Time: {duration}</Text>
            <Text style={{ marginBottom: "0px" }}>
              Aircraft: {aircraftType}
            </Text>
          </div>
        </Section>

        <Link href="#" style={buttonStyle as any}>
          I Acknowledge This Booking
        </Link>

        <Text>
          Please do not reply to this e-mail, as it cannot be answered from this
          address.
        </Text>
        <Text>
          For changes or questions about your reservation, you may contact{" "}
          {airline} Support via telephone at [Phone Number].
        </Text>
      </Container>
    </Body>
  </Html>
);

const mainStyle = {
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f4f4f4",
  color: "#333",
  padding: "20px",
};

const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const headerStyle = {
  backgroundColor: "#00508e",
  color: "white",
  padding: "10px",
  display: "block", // Use block instead of flex for email clients
};

const logoStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  marginRight: "20px",
};

const sectionStyle = {
  marginTop: "20px",
};

const flightContainerStyle = {
  backgroundColor: "#f0f0f0",
  padding: "15px",
  margin: "20px 0",
};

const dateStyle = {
  fontWeight: "bold",
  backgroundColor: "#00508e",
  color: "white",
  padding: "5px 10px",
  borderRadius: "5px",
};

const alignRightStyle: CSSProperties = {
  textAlign: "right",
  fontWeight: "bold",
  backgroundColor: "#f2d046",
  color: "#00508e",
  padding: "5px 10px",
  borderRadius: "5px",
};

const flightDetailsTableStyle = {
  width: "100%",
  marginTop: "10px",
};

const detailsStyle = {
  padding: "10px",
};

const timeStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  marginTop: "0px",
};

const buttonStyle = {
  backgroundColor: "#f2d046",
  border: "none",
  color: "#333",
  padding: "10px 20px",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  marginBottom: "20px",
  cursor: "pointer",
};

export default ItineraryEmail;
