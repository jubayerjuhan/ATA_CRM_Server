// import React from "react";
// import {
//   Html,
//   Head,
//   Preview,
//   Body,
//   Container,
//   Section,
//   Text,
//   Heading,
//   Link,
// } from "@react-email/components";
// import { CSSProperties } from "react";
// import moment from "moment";

// interface ItineraryEmailProps {
//   name: string;
//   company: string;
//   flights: any;
//   lead: any;
// }

// const ItineraryEmail = ({
//   name,
//   company,
//   flights,
//   lead,
// }: ItineraryEmailProps) => (
//   <Html>
//     <Head />
//     <Preview>Flight Itinerary for {name}</Preview>
//     <Body style={mainStyle}>
//       <Container style={containerStyle}>
//         <Section style={headerStyle}>
//           <Text style={logoStyle}>{company.toUpperCase()}</Text>
//           <Text>Flight Itinerary for {name}</Text>
//         </Section>

//         <Section style={sectionStyle}>
//           <Heading as="h2">Thank you for choosing {company}.</Heading>
//           <Text>Your reservation is confirmed.</Text>
//         </Section>

//         {flights.map((flight: any, index: number) => (
//           <Section style={flightContainerStyle}>
//             <table role="presentation" width="100%">
//               <tr>
//                 <td style={dateStyle}>
//                   {moment(flight.flt.departure.string).format(
//                     "DD MMMM YYYY [at] h:mm A"
//                   )}{" "}
//                   {flight.flt.departure.day}
//                 </td>
//                 <td style={alignRightStyle}>
//                   Flight: {flight.flt.iatacode} {flight.flt.flightNo}
//                 </td>
//               </tr>
//             </table>

//             <table
//               role="presentation"
//               width="100%"
//               style={flightDetailsTableStyle}
//             >
//               <tr>
//                 <td style={detailsStyle}>
//                   <Text style={timeStyle}>
//                     {moment(flight.flt.departure.string).format(
//                       "ddd, MMM D  h:mm A"
//                     )}
//                   </Text>
//                   <Text
//                     style={{
//                       marginBottom: "0px",
//                       fontWeight: "bold",
//                       ...timeStyle,
//                     }}
//                   >
//                     {flight.dep.cityname}
//                   </Text>
//                 </td>
//                 <td style={detailsStyle}>
//                   <Text style={timeStyle}>
//                     {moment(flight.flt.arrival.string).format(
//                       "ddd, MMM D  h:mm A"
//                     )}
//                   </Text>{" "}
//                   <Text
//                     style={{
//                       marginBottom: "0px",
//                       fontWeight: "bold",
//                       ...timeStyle,
//                     }}
//                   >
//                     {flight.arr.cityname}
//                   </Text>
//                 </td>
//               </tr>
//             </table>

//             <div>
//               <Text>Distance: {flight.flt.distance.km} KM</Text>
//               <Text>
//                 Travel Time: {flight.flt.duration.hours} Hours and{" "}
//                 {flight.flt.duration.minutes} Mins
//               </Text>
//               <Text>Cabin: {flight.flt.cabin}</Text>
//               <Text style={{ marginBottom: "0px" }}>
//                 Operated By: {flight.flt.operated_by}
//               </Text>
//               <img
//                 src={flight.flt["png-logo-low-res"]}
//                 alt=""
//                 style={{
//                   height: "50px",
//                   objectFit: "contain",
//                   padding: "5px",
//                   borderRadius: "5px",
//                   marginTop: "10px",
//                 }}
//               />
//             </div>
//           </Section>
//         ))}

//         <Link
//           href={
//             process.env.NODE_ENV === "production"
//               ? `${process.env.FRONTEND_URL_PROD}/acknowledgement?leadId=${lead._id}`
//               : `${process.env.FRONTEND_URL_PROD}/acknowledgement?leadId=${lead._id}`
//           }
//           style={buttonStyle as any}
//         >
//           I Acknowledge This Booking
//         </Link>

//         <Text>
//           Please do not reply to this e-mail, as it cannot be answered from this
//           address.
//         </Text>
//         <Text>
//           For changes or questions about your reservation, you may contact{" "}
//           {company}..
//         </Text>
//       </Container>
//     </Body>
//   </Html>
// );

// const mainStyle = {
//   fontFamily: "Arial, sans-serif",
//   backgroundColor: "#f4f4f4",
//   color: "#333",
//   padding: "20px",
// };

// const containerStyle = {
//   maxWidth: "600px",
//   margin: "0 auto",
//   padding: "20px",
// };

// const headerStyle = {
//   backgroundColor: "#00508e",
//   color: "white",
//   padding: "10px",
//   display: "block", // Use block instead of flex for email clients
// };

// const logoStyle = {
//   fontSize: "24px",
//   fontWeight: "bold",
//   marginRight: "20px",
// };

// const sectionStyle = {
//   marginTop: "20px",
// };

// const flightContainerStyle = {
//   backgroundColor: "#f0f0f0",
//   padding: "15px",
//   margin: "20px 0",
// };

// const dateStyle = {
//   fontWeight: "bold",
//   backgroundColor: "#00508e",
//   color: "white",
//   padding: "5px 10px",
//   borderRadius: "5px",
// };

// const alignRightStyle: CSSProperties = {
//   textAlign: "right",
//   fontWeight: "bold",
//   backgroundColor: "#f2d046",
//   color: "#00508e",
//   padding: "5px 10px",
//   borderRadius: "5px",
// };

// const flightDetailsTableStyle = {
//   width: "100%",
//   marginTop: "10px",
// };

// const detailsStyle = {
//   padding: "10px",
// };

// const timeStyle = {
//   fontSize: "18px",
//   marginTop: "0px",
// };

// const buttonStyle = {
//   backgroundColor: "#f2d046",
//   border: "none",
//   color: "#333",
//   padding: "10px 20px",
//   textAlign: "center",
//   textDecoration: "none",
//   display: "inline-block",
//   fontSize: "16px",
//   marginBottom: "20px",
//   cursor: "pointer",
// };

// export default ItineraryEmail;
