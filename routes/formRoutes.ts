import { Router, Request, Response } from "express";
import {
  addFormField,
  deleteFormField,
  editFormField,
} from "../controllers/FormController";

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/add-field").post(addFormField);
router.route("/edit-field").put(editFormField);
router.route("/delete-field/:id").delete(deleteFormField);

export default router;
