import mongoose, { Schema, Document } from "mongoose";

interface ILead extends Document {
  [key: string]: any; // Allows storing any key-value pair based on the fields
}

const LeadSchema: Schema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Arbitrary key-value pairs for lead data
  },
  { strict: false }
);

const Lead = mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
