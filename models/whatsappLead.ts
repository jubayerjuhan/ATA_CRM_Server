import mongoose, { Schema, Document } from "mongoose";

interface FormValues extends Document {
  name: string;
  phone: string;
  description: string;
  added_by: string;
}

const WhatsAppLeadSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  notes: [
    {
      text: { type: String, required: true },
      added_by: { type: Schema.Types.ObjectId, ref: "User" },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  added_by: { type: Schema.Types.ObjectId, ref: "User" },
});

const WhatsAppLead = mongoose.model<FormValues>(
  "WhatsAppLead",
  WhatsAppLeadSchema
);

export default WhatsAppLead;
