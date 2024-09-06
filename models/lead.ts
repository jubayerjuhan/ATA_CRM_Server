import mongoose, { Schema, Document } from "mongoose";

interface ILead extends Document {
  [key: string]: any; // Allows storing any key-value pair based on the fields
  createdAt: Date;
  claimed_by: string;
}

const LeadSchema: Schema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    departure: {
      type: Schema.Types.ObjectId,
      ref: "Airport",
    },
    arrival: {
      type: Schema.Types.ObjectId,
      ref: "Airport",
    },
    claimed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    call_logs: [
      {
        callType: {
          type: String,
          required: true,
        },
        notes: {
          type: String,
        },
        dateTime: {
          type: Date,
          required: true,
        },
      },
    ],
    // Arbitrary key-value pairs for lead data
  },
  { strict: false }
);

const Lead = mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
