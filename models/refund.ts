import mongoose, { Schema, Document } from "mongoose";

export interface IRefund extends Document {
  surname: string;
  firstName: string;
  mobileNumber: string;
  email: string;
  airline: string;
  ticketNumber: string;
  dateOfTravel: Date;
  pnrNumber: string;
  route: string;
  modeOfPayment: string;
  accountName: string;
  bankName: string;
  bsb: string;
  accountNumber: string;
}

// Define the Refund Schema
const refundSchema = new Schema(
  {
    surname: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email validation
    },
    airline: {
      type: String,
      required: true,
    },
    ticketNumber: {
      type: String,
      required: true,
    },
    dateOfTravel: {
      type: Date,
      required: true,
    },
    pnrNumber: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    modeOfPayment: {
      type: String,
      enum: ["Bank Transfer", "Credit Card", "PayPal", "Other"],
      default: "Bank Transfer",
    },
    accountName: {
      type: String,
      required: function (this: any) {
        return this.modeOfPayment === "Bank Transfer";
      },
    },
    bankName: {
      type: String,
      required: function (this: any) {
        return this.modeOfPayment === "Bank Transfer";
      },
    },
    bsb: {
      type: String,
      required: function (this: any) {
        return this.modeOfPayment === "Bank Transfer";
      },
    },
    accountNumber: {
      type: String,
      required: function (this: any) {
        return this.modeOfPayment === "Bank Transfer";
      },
    },
  },
  { timestamps: true }
);

// Export the model
export default mongoose.model<IRefund>("Refund", refundSchema);
