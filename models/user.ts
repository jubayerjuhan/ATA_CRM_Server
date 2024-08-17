import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import uniqueValidator from "mongoose-unique-validator";

import ErrorThrower from "../utils/errorThrower";

dotenv.config(); // Load environment variables from .env file

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "agent" | "admin";
  resetPasswordToken: String | null;
  resetPasswordExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email Is Required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
      "Invalid Email Format",
    ],
  },

  password: {
    type: String,
    required: true,
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  },

  role: {
    type: String,
    enum: ["agent", "admin"],
    default: "agent",
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash the password before creating user
userSchema.pre("save", async function (next) {
  if (!this.password) return next();
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS as string);
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);

    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(new ErrorThrower(500, "Error Creating User"));
  }
});

// Compare the password on login
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  try {
    const same = await bcrypt.compare(enteredPassword, this.password);
    return same;
  } catch (error) {
    return false;
  }
};

// Apply the uniqueValidator plugin to userSchema with a custom error message
userSchema.plugin(uniqueValidator, {
  message: "{VALUE} is already in use.",
});

const User = model<IUser>("User", userSchema);

export default User;
