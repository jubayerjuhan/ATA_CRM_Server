import express from "express";
import { checkRole } from "../middlewares";
import {
  addWhatsAppLead,
  getAllWhatsAppLeads,
  getWhatsAppLeadsByUser,
} from "../controllers/WhatsAppLeadController";

const router = express.Router();

// Route to get all WhatsApp leads
router
  .route("/")
  .post(checkRole(["admin", "agent"]), addWhatsAppLead)
  .post(checkRole(["admin", "agent"]), getAllWhatsAppLeads);

router
  .route("/my-leads")
  .post(checkRole(["admin", "agent"]), getWhatsAppLeadsByUser);

export default router;
