import { Router, Request, Response } from "express";
import { getAirlines } from "../controllers/AirlinesController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").get(getAirlines);

export default router;
