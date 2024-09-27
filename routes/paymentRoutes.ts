import { Router, Request, Response } from "express";
import {
  createAndSendPaymentLink,
  paymentMethodSelector,
  retrivePaymentInformation,
} from "../controllers/PaymentController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/create-payment-link").post(createAndSendPaymentLink);
router.route("/check-payment-status/:sessionId").get(retrivePaymentInformation);
router.route("/:id/send-payment-email").post(paymentMethodSelector);

export default router;
