import { Router, Request, Response } from "express";
import {
  addFormField,
  deleteFormField,
  editFormField,
} from "../controllers/FormController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").post(addFormField);
router.route("/:id").put(editFormField);
router.route("/:id").delete(deleteFormField);

export default router;
