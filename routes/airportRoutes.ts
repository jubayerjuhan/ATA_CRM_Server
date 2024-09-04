import { Router, Request, Response } from "express";
import { getAirports } from "../controllers/AirportController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").get(getAirports);

export default router;
