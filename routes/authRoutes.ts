import { Router, Request, Response } from "express";
import {
  forgotPassword,
  loginUser,
  resetPassword,
  signUpUser,
} from "../controllers/AuthController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/signup").post(signUpUser);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:resetToken").post(resetPassword);

export default router;
