import { Router, Request, Response } from "express";
import { getMyFollowUps } from "../controllers/FollowupController";
import { checkRole } from "../middlewares";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router
  .route("/my-follow-ups")
  .get(checkRole(["admin", "agent"]), getMyFollowUps);

export default router;
