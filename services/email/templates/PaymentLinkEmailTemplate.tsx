import React, { CSSProperties } from "react";
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

interface PaymentEmailProps {
  name: string;
  company: string;
  lead: any;
}

const PaymentEmailTemplate = ({ name, company, lead }: PaymentEmailProps) => {
  const quotedAmount = lead.quoted_amount.toObject
    ? lead.quoted_amount.toObject()
    : Object.fromEntries(lead.quoted_amount);

  const totalAmount = lead.quoted_amount.get("total");

  return (
    <Html>
      <Head />
      <Preview>Payment Method Selection for Your Flight Reservation</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>{company.toUpperCase()}</Text>
            <Text>Payment Method Selection for {name}</Text>
          </Section>

          <Section style={sectionStyle}>
            <Heading as="h2">Choose Your Payment Method</Heading>
            <Text>
              Your total amount:{" "}
              <strong>${lead.quoted_amount.get("total")}</strong>
            </Text>
          </Section>

          {/* <Section style={sectionStyle}>
            <Heading as="h3">Breakdown:</Heading>
            <table role="presentation" width="100%" style={breakdownTableStyle}>
              {Array.from(Object.entries(quotedAmount)).map(([key, value]) => (
                <tr key={key}>
                  <td style={detailsStyle}>
                    {key
                      .split("_")
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                    :
                  </td>
                  <td style={alignRightStyle}>${value as number}</td>
                </tr>
              ))}
            </table>
          </Section> */}

          <Section style={buttonSectionStyle}>
            <Link
              href={`${process.env.FRONTEND_URL_PROD}/select-payment-method?method=stripe`}
              style={buttonStyle}
            >
              Pay by Stripe
            </Link>
            <Link
              href={`${process.env.FRONTEND_URL_PROD}/select-payment-method?method=cash`}
              style={buttonStyle}
            >
              Pay by Cash
            </Link>
            <Link
              href={`${process.env.FRONTEND_URL_PROD}/select-payment-method?method=SlicePay`}
              style={buttonStyle}
            >
              Pay by SlicePay
            </Link>
          </Section>

          <Text style={footerTextStyle}>
            Please do not reply to this e-mail. For payment-related queries,
            contact {company}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const getPaymentLink = (method: string, leadId: string) => {
  return `${
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL_PROD
      : process.env.FRONTEND_URL_DEV
  }/payment/${method}?leadId=${leadId}`;
};

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
};

const logoStyle = {
  fontSize: "24px",
  fontWeight: "bold",
};

const sectionStyle = {
  marginTop: "20px",
};

const breakdownTableStyle = {
  width: "100%",
  margin: "20px 0",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  padding: "10px",
};

const detailsStyle = {
  padding: "5px 0",
};

const alignRightStyle: CSSProperties = {
  textAlign: "right",
};

const totalAmountStyle: CSSProperties = {
  textAlign: "right",
  fontWeight: "bold",
  fontSize: "18px",
};

const buttonSectionStyle = {
  display: "flex",
  justifyContent: "space-around",
  marginTop: "20px",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#00508e",
  color: "white",
  padding: "10px 20px",
  textDecoration: "none",
  borderRadius: "5px",
  textAlign: "center",
  display: "inline-block",
  fontSize: "16px",
  cursor: "pointer",
  marginRight: "10px",
};

const footerTextStyle = {
  fontSize: "12px",
  marginTop: "20px",
  color: "#666",
};

export default PaymentEmailTemplate;
