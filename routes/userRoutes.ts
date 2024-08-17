import { Router, Request, Response } from "express";

import { getAllUsers } from "../controllers/UserController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/list").get(getAllUsers);

export default router;
