import { Router, Request, Response } from "express";
import {
  addRefundRequest,
  deleteRefundRequest,
  editRefundRequest,
  getRefundRequest,
  getRefundRequests,
} from "../controllers/RefundController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").post(addRefundRequest).get(getRefundRequests);
router
  .route("/:id")
  .post(getRefundRequest)
  .delete(deleteRefundRequest)
  .put(editRefundRequest);

export default router;
