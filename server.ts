import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";

// configuration imports
import { connectDatabase } from "./config/database";
// routes import
import {
  airportRoutes,
  authRoutes,
  customerRoutes,
  formRoutes,
  leadRoutes,
  paymentRoutes,
  stripeWebhookRoutes,
  userRoutes,
  refundRoutes,
  airlinesRoutes,
  followupRoutes,
  emailRoutes,
  whatsAppLeadRoutes,
  facebookLeadRoutes,
} from "./routes";
// Error catcher middleware import
import { errorCatcher } from "./utils/errorCatcher";

// Create Express server
const app = express();

// dotenv
dotenv.config();

// Add CORS middleware
app.use(cors());

// Stripe webhook route - this should come before any body parsing middleware
app.use("/webhook", stripeWebhookRoutes);

// Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: false }));

console.log("Hey Juhan The Champ! Did You Took Your Med's?...");
// connect the database
connectDatabase();

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!, Welcome to the server...");
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/form", formRoutes);
app.use("/leads", leadRoutes);
app.use("/whatsapp-leads", whatsAppLeadRoutes);
app.use("/customers", customerRoutes);
app.use("/airports", airportRoutes);
app.use("/payment", paymentRoutes);
app.use("/refund", refundRoutes);
app.use("/airlines", airlinesRoutes);
app.use("/followups", followupRoutes);
app.use("/email", emailRoutes);
app.use("/facebook-leads", facebookLeadRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(errorCatcher);
