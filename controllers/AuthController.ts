import crypto from "crypto";
import FormData from "form-data";
import { NextFunction, Request, Response } from "express";

import User from "../models/user";

import ErrorThrower from "../utils/errorThrower";
import { sendJwt } from "../utils/sendJwt";
import { sendPasswordResetEmail } from "../services";

export const signUpUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract user data from request body
  const { name, email, password } = req.body;

  try {
    const user = await User.create({
      ...req.body,
    });

    console.log(user, "user....");

    const message = `Welcome ${name}, Your Account Has Been Created Successfully`;

    // setting mongodb user id as string
    const userId = (user._id as string).toString();

    // sending the jwt token and the payment link
    sendJwt(user, res, "signup", message);
  } catch (error: any) {
    next(error);
  }
};

// login user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract user data from request body
    const { email, password } = req.body;

    if (!email || !password)
      throw new ErrorThrower(404, "Please Enter Email and Password");

    const user = await User.findOne({ email }).select("password name");

    console.log(user, "user");

    if (!user) throw new ErrorThrower(404, "No User Found With This Email");

    const is_password_valid = await user.comparePassword(password);

    if (!is_password_valid)
      throw new ErrorThrower(401, "Incorrect Email or Password");

    const message = `Successfully Logged In, Welcome Back ${user.name}`;
    sendJwt(user, res, "login", message);
  } catch (error) {
    next(error);
  }
};

// sign in with oauth
/*
export const signInWithOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { uid } = req.body;

    const userRecord = await firebaseAdmin.auth().getUser(uid);
    if (!userRecord) throw new ErrorThrower(404, "User Not Found");

    const user = await User.findOne({ email: userRecord.email });

    if (!user) {
      const newUser = {
        name: userRecord.displayName,
        email: userRecord.email,
        oAuth: true,
      };

      const createdUser = await User.create({
        ...newUser,
        oAuth: true,
      });

      sendJwt(createdUser, res, "login");
    } else {
      sendJwt(user, res, "login");
    }
  } catch (error) {
    next(error);
  }
};
*/

// forgot password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // assigning frontend url based on the environment
  const frontendUrl =
    process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_LOCAL
      : process.env.FRONTEND_URL_PROD;

  try {
    // Extract user data from request body
    const { email } = req.body;
    if (!email) throw new ErrorThrower(400, "Please Enter Email");

    const user = await User.findOne({ email });
    if (!user) throw new ErrorThrower(404, "No User Found With This Email");

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.save();

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(email, resetUrl);
    // if (!email_sent) throw new ErrorThrower(500, "Error Sending Email");
    const message = "Password reset email has been sent";
    res.status(200).json({ success: true, message, resetUrl });
  } catch (error) {
    next(error);
  }
};

// reset password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  console.log(resetToken, password, "resetToken, password");
  try {
    // Check if reset token and password are provided
    if (!resetToken || !password) {
      throw new ErrorThrower(400, "Invalid or expired token");
    }

    // get the hashed reset token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user with the hashed token and token expiry date greater than now
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    // Check if user exists
    if (!user) {
      throw new ErrorThrower(400, "Invalid or expired token");
    }

    // Set new password and reset token to null
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ success: true, message: "Password reset success" });
  } catch (error) {
    next(error);
  }
};

// send a test email
export const sendTestEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({ success: true, message: "Email Sent Successfully" });
  } catch (error) {
    next(error);
  }
};
