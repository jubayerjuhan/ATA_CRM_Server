import { Router, Request, Response } from "express";

import { checkRole } from "../middlewares";
import { getAllCustomers } from "../controllers/customerController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").get(checkRole(["admin", "agent"]), getAllCustomers);

export default router;
