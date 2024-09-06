import { Router, Request, Response } from "express";
import {
  createAndSendPaymentLink,
  retrivePaymentInformation,
} from "../controllers/PaymentController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/create-payment-link").post(createAndSendPaymentLink);
router.route("/check-payment-status/:sessionId").get(retrivePaymentInformation);

export default router;
