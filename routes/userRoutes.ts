import { Router, Request, Response } from "express";

import {
  changeUserRole,
  deleteUser,
  getAllUsers,
  getUsersOverview,
} from "../controllers/UserController";
import { checkRole } from "../middlewares";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/list").get(getAllUsers);
router.route("/:userId").delete(deleteUser);
router.route("/:userId").put(changeUserRole);
router
  .route("/overview-list")
  // .all(checkRole(["admin, user"]))
  .get(getUsersOverview);

export default router;
