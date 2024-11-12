import express from "express";
import { checkRole } from "../middlewares";
import {
  addFacebookLead,
  deleteFacebookLead,
  getAllFacebookLeads,
  getFacebookLead,
  getMyFacebookLeads,
  markFacebookLeadAsAdded,
} from "../controllers/FacebookLeadController";

const router = express.Router();

// Route to get all WhatsApp leads
router.route("/").post(addFacebookLead).get(getAllFacebookLeads);

// get single lead
router
  .route("/:id")
  .get(checkRole(["admin", "agent"]), getFacebookLead)
  .delete(checkRole(["admin", "agent"]), deleteFacebookLead)
  .put(checkRole(["admin", "agent"]), deleteFacebookLead);

router
  .route("/mark-as-added/:id")
  .post(checkRole(["admin", "agent"]), markFacebookLeadAsAdded);

router.route("/my/list").get(checkRole(["admin", "agent"]), getMyFacebookLeads);

export default router;
