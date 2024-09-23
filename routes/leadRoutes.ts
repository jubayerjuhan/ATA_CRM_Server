import { Router, Request, Response } from "express";
import {
  addCallLog,
  addLead,
  claimLead,
  convertLead,
  deleteLead,
  editLead,
  getAllConvertedLeads,
  getAllLeads,
  getLeadById,
  getLeadsByUser,
  searchLeadByEmail,
  sendPnrConfirmationEmail,
} from "../controllers/LeadController";
import { checkRole } from "../middlewares";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").post(checkRole(["admin", "agent"]), addLead);
router.route("/").get(getAllLeads);
router
  .route("/converted-leads/list")
  .get(checkRole(["admin", "agent"]), getAllConvertedLeads);
router.route("/:id").get(getLeadById);
router.route("/:id").put(editLead);
router.route("/:id/claim-lead").post(checkRole(["admin", "agent"]), claimLead);
router
  .route("/:id/convert-lead")
  .post(checkRole(["admin", "agent"]), convertLead);
router.route("/:id/add-call-log").put(addCallLog);
router.route("/:id").delete(deleteLead);

// Route to get leads by a specific user
router.route("/user/:userId").get(getLeadsByUser);

// Search leads
router.route("/search").post(searchLeadByEmail);

// Send pnr confirmation email
router.route("/:leadId/send-pnr-confirmation").post(sendPnrConfirmationEmail);
export default router;
