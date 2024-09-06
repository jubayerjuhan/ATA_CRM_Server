import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
// configuration imports
import { connectDatabase } from "./config/database";
// routes import
import {
  airportRoutes,
  authRoutes,
  formRoutes,
  leadRoutes,
  paymentRoutes,
  stripeWebhookRoutes,
  userRoutes,
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
    bodyParser.json()(req, res, next);
  }
});
app.use(bodyParser.urlencoded({ extended: false }));

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
app.use("/airports", airportRoutes);
app.use("/payment", paymentRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(errorCatcher);
