import { Router, Request, Response } from "express";
import {
  deleteFollowUp,
  getMyFollowUps,
  getTotalFollowUps,
} from "../controllers/FollowupController";
import { checkRole } from "../middlewares";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router
  .route("/my-follow-ups")
  .get(checkRole(["admin", "agent"]), getMyFollowUps);
router.route("/").get(checkRole(["admin"]), getTotalFollowUps);
router.route("/:id").delete(checkRole(["admin", "agent"]), deleteFollowUp);

export default router;
