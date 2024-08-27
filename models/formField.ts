import mongoose, { Schema, Document } from "mongoose";

interface IField extends Document {
  name: string;
  type: string;
  label: string;
  required: boolean;
}

const FormFieldSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
});

const FormField = mongoose.model<IField>("FormField", FormFieldSchema);

export default FormField;
