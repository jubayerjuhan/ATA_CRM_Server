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
import {
  getRequestPerfSnapshot,
  runWithRequestPerfContext,
} from "./utils/performanceProfiler";

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

const tableEndpointPrefixes = [
  "/leads",
  "/customers",
  "/followups",
  "/user/list",
  "/whatsapp-leads",
  "/facebook-leads",
  "/refund",
  "/form",
];

const isTableEndpoint = (path: string) =>
  tableEndpointPrefixes.some((prefix) => path.startsWith(prefix));

const getRowsReturned = (body: unknown): number | null => {
  if (Array.isArray(body)) return body.length;
  if (!body || typeof body !== "object") return null;

  const candidates = [
    "leads",
    "customers",
    "followups",
    "totalFollowups",
    "users",
    "formFields",
    "data",
  ];

  for (const key of candidates) {
    const value = (body as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value.length;
  }

  return null;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isTableEndpoint(req.path)) {
    next();
    return;
  }

  runWithRequestPerfContext(() => {
    const requestStartedAt = new Date();
    const requestStartTime = process.hrtime.bigint();
    let payloadBytes = 0;
    let rowsReturned: number | null = null;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      try {
        payloadBytes = Buffer.byteLength(JSON.stringify(body ?? {}), "utf-8");
      } catch {
        payloadBytes = 0;
      }
      rowsReturned = getRowsReturned(body);
      return originalJson(body);
    }) as typeof res.json;

    const originalSend = res.send.bind(res);
    res.send = ((body?: any) => {
      if (payloadBytes === 0 && body !== undefined && body !== null) {
        const bodyAsString =
          typeof body === "string"
            ? body
            : Buffer.isBuffer(body)
              ? body.toString("utf-8")
              : JSON.stringify(body);
        payloadBytes = Buffer.byteLength(bodyAsString, "utf-8");
      }
      return originalSend(body);
    }) as typeof res.send;

    res.on("finish", () => {
      const requestEndTime = process.hrtime.bigint();
      const totalMs = Number(requestEndTime - requestStartTime) / 1_000_000;
      const snapshot = getRequestPerfSnapshot();
      const requestEndedAt = new Date();
      const queriesSummary =
        snapshot?.dbQueries
          .map(
            (query) =>
              `${query.model}.${query.operation}:${query.ms}ms(rows=${query.rows})`
          )
          .join(", ") ?? "none";

      console.log(
        `[PERF] ${req.method} ${req.originalUrl} start=${requestStartedAt.toISOString()} end=${requestEndedAt.toISOString()} totalMs=${totalMs.toFixed(
          2
        )} dbMs=${snapshot?.dbMs ?? 0} dbRows=${snapshot?.dbRows ?? 0} rowsReturned=${
          rowsReturned ?? "n/a"
        } payloadBytes=${payloadBytes} status=${res.statusCode} dbQueries=[${queriesSummary}]`
      );
    });

    next();
  });
});

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
