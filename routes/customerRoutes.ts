import { Router, Request, Response } from "express";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

import { checkRole } from "../middlewares";
import {
  addQuotedAmount,
  getAllCustomers,
  getCustomersByDate,
  sendItineraryEmailController,
  sendTicketEmail,
} from "../controllers/customerController";
import multer from "multer";

// Create multer storage
const upload = multer({ storage: multer.memoryStorage() });

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
router
  .route("/filter/converted")
  .get(checkRole(["admin", "agent"]), getCustomersByDate);
router
  .route("/ticket/send-ticket-email")
  .post(upload.array("ticket", 50), sendTicketEmail);

export default router;
