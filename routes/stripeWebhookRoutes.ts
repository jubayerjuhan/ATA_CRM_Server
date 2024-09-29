import express, { Request, Response } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Lead from "../models/lead";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // Use the latest stable version
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log(event.type, "event type");
    } catch (err: any) {
      console.log(err, "this is error");
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const leadId = session.metadata?.leadId;

  if (leadId) {
    try {
      // Assuming you have a Lead model or database access method
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.payment.status = "completed";
        lead.status = "Payment Complete";
        lead.converted = true;
        await lead.save();
        console.log(`Payment status updated to paid for lead ${leadId}`);
      } else {
        console.log(`Lead not found with ID ${leadId}`);
      }
    } catch (error) {
      console.error(`Error updating lead ${leadId}:`, error);
    }
  } else {
    console.log("No leadId provided in session metadata");
  }

  // Here you can update your database, send confirmation emails, etc.
}

export default router;
