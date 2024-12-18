import { Router, Request, Response } from "express";
import {
  createAndSendPaymentLink,
  handleSlicePayment,
  paymentMethodSelector,
  retrivePaymentInformation,
} from "../controllers/PaymentController";
import {
  confirmMintpaymentTransaction,
  createTransactionToken,
  processTo3DSPage,
} from "../controllers/mintpaymentsController";
// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/create-payment-link").post(createAndSendPaymentLink);
router.route("/mint-pay/process-3ds").post(processTo3DSPage);
router
  .route("/mint-pay/confirm-payment/:leadId")
  .post(confirmMintpaymentTransaction);
router.route("/mint-pay/create-transaction-token").post(createTransactionToken);
router.route("/successfull-slicepay-payment").post(handleSlicePayment);
router.route("/check-payment-status/:sessionId").get(retrivePaymentInformation);
router.route("/:id/send-payment-email").post(paymentMethodSelector);

export default router;
