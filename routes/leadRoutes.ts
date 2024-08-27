import { Router, Request, Response } from "express";
import {
  addLead,
  deleteLead,
  editLead,
  getAllLeads,
  getLeadById,
} from "../controllers/LeadController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").post(addLead);
router.route("/").get(getAllLeads);
router.route("/:id").get(getLeadById);
router.route("/:id").put(editLead);
router.route("/:id").delete(deleteLead);

export default router;
