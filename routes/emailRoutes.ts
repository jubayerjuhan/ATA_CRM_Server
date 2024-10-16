import { Router, Request, Response } from "express";
import { checkRole } from "../middlewares";
import { sendEmail } from "../controllers/EmailController";

import multer from "multer";

// Create multer storage
const upload = multer({ storage: multer.memoryStorage() });

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router
  .route("/send-email")
  .post(checkRole(["admin", "agent"]), upload.array("ticket", 50), sendEmail);

export default router;
