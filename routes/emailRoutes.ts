import { Router, Request, Response } from "express";
import { checkRole } from "../middlewares";
import { sendEmail } from "../controllers/EmailController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/send-email").post(checkRole(["admin", "agent"]), sendEmail);

export default router;
