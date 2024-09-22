import { Router, Request, Response } from "express";
import {
  addCallLog,
  addLead,
  claimLead,
  deleteLead,
  editLead,
  getAllLeads,
  getLeadById,
  getLeadsByUser,
  sendPnrConfirmationEmail,
} from "../controllers/LeadController";
import { checkRole } from "../middlewares";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").post(checkRole(["admin", "agent"]), addLead);
router.route("/").get(getAllLeads);
router.route("/:id").get(getLeadById);
router.route("/:id").put(editLead);
router.route("/:id/claim-lead").post(checkRole(["admin", "agent"]), claimLead);
router.route("/:id/add-call-log").put(addCallLog);
router.route("/:id").delete(deleteLead);

// Route to get leads by a specific user
router.route("/user/:userId").get(getLeadsByUser);

// Send pnr confirmation email
router.route("/:leadId/send-pnr-confirmation").post(sendPnrConfirmationEmail);
export default router;
