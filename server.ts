import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// configuration imports
import { connectDatabase } from "./config/database";

// routes import
import { authRoutes, formRoutes, userRoutes } from "./routes";

// Error catcher middleware import
import { errorCatcher } from "./utils/errorCatcher";

// Create Express server
const app = express();

// dotenev
dotenv.config();

// Add CORS middleware
app.use(cors());

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json

// connect the database
connectDatabase();

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!, Welcome to the server...");
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/form", formRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(errorCatcher);
