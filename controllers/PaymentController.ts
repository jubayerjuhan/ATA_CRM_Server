import { Request, Response } from "express";
import Stripe from "stripe";
import Lead from "../models/lead";
import { sendPaymentLinkEmail } from "../services";
import { sendPaymentMethodSelectorEmail } from "../services/email/paymentMethodSelectEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // Use the latest API version
});

export const handleSlicePayment = async (req: Request, res: Response) => {
  console.log("Slice Payment Request", req.body);

  res.json({ message: "Slice Payment Request Received", success: true });
};

export const createAndSendPaymentLink = async (req: Request, res: Response) => {
  try {
    // Extract amount and currency from the request body
    const { currency, leadId } = req.body;

    // Validate input
    if (!currency || !leadId) {
      return res
        .status(400)
        .json({ error: "Amount, currency and lead id are required" });
    }

    // Search for the lead and save payment information
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (lead.payment.status === "completed") {
      return res.status(500).json({ error: "Payment Already Made" });
    }
    const quotedAmount = Number(lead.quotedAmount);

    // Validate input
    if (!quotedAmount) {
      return res.status(400).json({ error: "Amount is required" });
    }
    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: { leadId },
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: quotedAmount * 100,
            product_data: {
              name: "Payment",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL_PROD}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL_PROD}/payment-failed`,
    });

    // Update the lead's payment object
    lead.payment = {
      ...lead.payment,
      paymentUrl: session.url,
      sessionId: session.id,
      amount: quotedAmount,
      currency: currency,
      status: "pending",
    };

    lead.status = "Payment Link Sent";

    try {
      await sendPaymentLinkEmail(lead.email, lead.firstName, {
        amount: quotedAmount,
        currency: "USD",
        paymentLink: session.url as string,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed To Send Payment Link In Email" });
    }

    // Save the updated lead
    await lead.save();

    res
      .status(200)
      .json({ message: "Payment Link Sent To The Email", success: true });

    // Send the payment link as the response
  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(500).json({ error: "Failed to create payment link" });
  }
};

// get the payment link information with session id
export const retrivePaymentInformation = async (
  req: Request,
  res: Response
) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check the payment status
    let paymentStatus;
    if (session.payment_status === "paid") {
      paymentStatus = "Paid";
    } else if (session.payment_status === "unpaid") {
      paymentStatus = "Unpaid";
    } else {
      paymentStatus = "Unknown";
    }

    // Send the payment status as the response
    res.json({
      paymentStatus,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
};

// send payment link in email

export const paymentMethodSelector = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    if (!leadId) {
      return res.status(400).json({ error: "Lead ID is required" });
    }

    // Retrieve the lead
    const lead = await Lead.findById(leadId);

    if (!lead?.quoted_amount) {
      return res
        .status(500)
        .json({ message: "Please add quoted amount first", success: true });
    }

    // Send the payment link in email
    await sendPaymentMethodSelectorEmail(lead.email, lead);

    res.json({ message: "Payment link sent in email", success: true });
  } catch (error) {
    console.error("Error sending payment link in email:", error);
    res.status(500).json({ error: "Failed to send payment link in email" });
  }
};
