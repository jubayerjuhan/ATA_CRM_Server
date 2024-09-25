import { Router, Request, Response } from "express";

import { checkRole } from "../middlewares";
import {
  addQuotedAmount,
  getAllCustomers,
  sendItineraryEmailController,
} from "../controllers/customerController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").get(checkRole(["admin", "agent"]), getAllCustomers);
router
  .route("/:id/add-quoted-amount")
  .put(checkRole(["admin", "agent"]), addQuotedAmount);
router
  .route("/:id/send-itinerary-email")
  .post(checkRole(["admin", "agent"]), sendItineraryEmailController);

export default router;
