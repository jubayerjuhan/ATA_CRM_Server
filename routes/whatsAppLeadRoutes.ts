import express from "express";
import { checkRole } from "../middlewares";
import {
  addWhatsAppLead,
  addWhatsAppLeadWithNotes,
  getAllWhatsAppLeads,
  getWhatsAppLead,
  getWhatsAppLeadsByUser,
} from "../controllers/WhatsAppLeadController";

const router = express.Router();

// Route to get all WhatsApp leads
router
  .route("/")
  .post(checkRole(["admin", "agent"]), addWhatsAppLead)
  .get(checkRole(["admin", "agent"]), getAllWhatsAppLeads);

// get single lead
router.route("/single/:id").get(checkRole(["admin", "agent"]), getWhatsAppLead);

router
  .route("/:id/notes")
  .post(checkRole(["admin", "agent"]), addWhatsAppLeadWithNotes);

router
  .route("/my-leads")
  .get(checkRole(["admin", "agent"]), getWhatsAppLeadsByUser);

router
  .route("/my-leads")
  .get(checkRole(["admin", "agent"]), getWhatsAppLeadsByUser);

export default router;
