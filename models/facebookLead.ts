import { Schema, model, Document } from "mongoose";

interface IFacebookLead extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  added: boolean;
}

const FacebookLeadSchema = new Schema<IFacebookLead>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  added: { type: Boolean, default: false },
  // added_by: {
  //   type: Schema.Types.String,
  //   ref: "User",
  //   required: true,
  // },
});

const FacebookLead = model<IFacebookLead>("FacebookLead", FacebookLeadSchema);

export default FacebookLead;
