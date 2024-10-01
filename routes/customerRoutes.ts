import { Router, Request, Response } from "express";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

import { checkRole } from "../middlewares";
import {
  addQuotedAmount,
  getAllCustomers,
  getCustomersByDate,
  sendItineraryEmailController,
} from "../controllers/customerController";

// Create a new router for auth routes
const router: Router = Router();

// Configure multer to handle multiple PDF uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // store locally before sending to PDFRest
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + "-" + file.originalname);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // limit file size to 5MB per file
//   },
// });

// Define the routes
router.route("/").get(checkRole(["admin", "agent"]), getAllCustomers);
router
  .route("/:id/add-quoted-amount")
  .put(checkRole(["admin", "agent"]), addQuotedAmount);
router
  .route("/:id/send-itinerary-email")
  .post(checkRole(["admin", "agent"]), sendItineraryEmailController);
router.route("/filter/converted").get(getCustomersByDate);

// Handle multiple PDF uploads (up to 5 files at once)
// router.post(
//   "/upload-pdfs",
//   upload.array("pdfs", 5), // 'pdfs' is the field name in the form
//   async (req: Request, res: Response) => {
//     if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
//       return res.status(400).send("No files uploaded.");
//     }

//     const uploadedFiles = req.files as Express.Multer.File[];

//     try {
//       const fileUrls: string[] = [];
//       console.log(fileUrls);

//       // Loop through each file and upload to PDFRest
//       for (const file of uploadedFiles) {
//         const formData = new FormData();
//         formData.append("file", fs.createReadStream(file.path));

//         const config = {
//           method: "post",
//           maxBodyLength: Infinity,
//           url: "https://api.pdfrest.com/upload", // PDFRest API endpoint
//           headers: {
//             "Api-Key": "d078aa73-add5-4452-9876-156e83421cf0", // replace with your actual API key
//             ...formData.getHeaders(),
//           },
//           data: formData,
//         };

//         const response = await axios(config);

//         console.log(response.data, "response...");
//         // Assuming PDFRest API returns the URL in `response.data.url`
//         fileUrls.push(response.data.url);

//         // Delete the file from the local server after upload
//         fs.unlinkSync(file.path);
//       }

//       res.status(200).json({
//         message: "Files uploaded successfully",
//         urls: fileUrls,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Error uploading files" });
//     }
//   }
// );

export default router;
