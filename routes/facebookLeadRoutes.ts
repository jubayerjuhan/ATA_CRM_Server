import express from "express";
import { checkRole } from "../middlewares";
import {
  addFacebookLead,
  deleteFacebookLead,
  getAllFacebookLeads,
  getFacebookLead,
  getMyFacebookLeads,
} from "../controllers/FacebookLeadController";

const router = express.Router();

// Route to get all WhatsApp leads
router
  .route("/")
  .post(addFacebookLead)
  .get(checkRole(["admin", "agent"]), getAllFacebookLeads);

// get single lead
router
  .route("/:id")
  .get(checkRole(["admin", "agent"]), getFacebookLead)
  .delete(checkRole(["admin", "agent"]), deleteFacebookLead);

router.route("/my/list").get(checkRole(["admin", "agent"]), getMyFacebookLeads);

export default router;
