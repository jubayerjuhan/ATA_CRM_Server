import { Request, Response } from "express";
import axios from "axios";
import Lead from "../models/lead";

interface ChargeRequest {
  amount: number;
  cardToken: string;
  description?: string;
  customerEmail: string;
}

interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardHolderName: string;
}

// Add new interface for transaction token
interface TransactionToken {
  token: string;
  card_token: string;
  amount: number;
  currency: string;
}

type Lead = {
  _id: {
    $oid: string;
  };
  leadOrigin: any; // Add more options if there are other lead origins
  claimed_by: {
    $oid: string;
  } | null;
  payment: {
    status: any; // Add other payment statuses if necessary
  };
  status: "In Progress" | "Completed" | "Cancelled" | "Pending"; // Add other statuses if there are any
  itenary_email_sent: boolean;
  cancelled: boolean;
  quoted_amount: {
    total: number;
  };
  converted: boolean;
  ticket_sent: boolean;
  ticket_links: string[];
  booking_id: string;
  email: string;
  passengerType: "New" | "Returning"; // Assuming passenger type can be "New" or "Returning"
  leadType: "Hot" | "Warm" | "Cold"; // Assuming lead types could be "Hot", "Warm", or "Cold"
  firstName: string;
  lastName: string;
  postCode: string;
  phone: string;
  caseDate: Date;
  createdAt: Date;
  call_logs: any[]; // Define CallLog type if there are specific properties for call logs
  __v: number;
};

// STEP 1: Card Tokenization
export const processTo3DSPage = async (req: Request, res: Response) => {
  const { leadId, cardDetails } = req.body;

  try {
    const lead: any = await Lead.findOne({ _id: leadId });

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // return res.status(200).json({
    //   data: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    //   message: "Lead found",
    // });
    const transactionToken = await generateTransactionToken();

    // console.log(req.body, "req.body");

    const response = await axios.post(
      `${process.env.MINT_PAYMENTS_API_URL}/purchase`,
      {
        token: {
          company_token: `${process.env.MINT_PAYMENTS_COMPANY_TOKEN}`,
          transaction_token: transactionToken,
        },
        customer: {
          reference: leadId,
          email: lead.email,
          accepted_terms_conditions: "",
          ip_address: req.ip,
          timezone: "Australia/Sydney",
          store_card_permission: true,
          id: "",
          should_mint_apply_authentication: true,
          authentication_redirect_url: `${process.env.FRONTEND_URL_PROD}/mintpay-payment-confirmation/${leadId}`,
        },
        card: {
          token: "",
          number: cardDetails.card_number,
          expiry_month: cardDetails.expiry_month,
          expiry_year: cardDetails.expiry_year,
          cvc: cardDetails.cvc,
          holder_name: cardDetails.cardholder_name,
        },
        purchase: {
          // invoice_number: "5234234-John-Doe",
          // amount: lead.quoted_amount.get("total"),
          amount: 1,
          invoice_number: `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`,
          should_mint_apply_surcharge: false,
          should_mint_apply_pre_authorisation: true,
          currency: "AUD",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MINT_PAYMENTS_BEARER_TOKEN}`,
        },
      }
    );

    if (
      response.data.purchase.status === "DECLINED" ||
      !response.data.customer?.authentication_redirect_url
    ) {
      return res.status(400).json({
        success: false,
        message: response.data.response_message,
      });
    }
    console.log(response, "response from the mintpay....");

    lead.purchase_reference = response.data.purchase.purchase_reference;
    await lead.save();

    return res.status(200).json({
      success: true,
      auth_url: response.data.customer?.authentication_redirect_url,
    });
  } catch (error: any) {
    console.log("Error processing payment:", error);
    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.error_message || "Failed to process payment",
    });
  }
};

// Confirm mintpayment payment status
export const confirmMintpaymentTransaction = async (
  req: Request,
  res: Response
) => {
  try {
    const { leadId } = req.params;
    if (!leadId) {
      return res.status(400).json({ error: "Lead Id is required" });
    }

    // Find lead by ID
    const lead: any = await Lead.findOne({ _id: leadId });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Check if purchase reference is available
    const purchaseReference = lead.purchase_reference;
    if (!purchaseReference) {
      return res.status(400).json({ error: "Purchase reference is required" });
    }

    // Fetch transaction status
    const response = await axios.post(
      `${process.env.MINT_PAYMENTS_API_URL}/purchase/${purchaseReference}`,
      {
        company_token: `${process.env.MINT_PAYMENTS_COMPANY_TOKEN}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MINT_PAYMENTS_BEARER_TOKEN}`,
        },
      }
    );

    if (response.data.status === "APPROVED") {
      lead.payment.status = "completed";
      lead.payment.date = new Date();
      await lead.save();

      return res.status(200).json({
        success: true,
        payment_status: response.data.status,
      });
    }

    return res.status(200).json({
      success: true,
      payment_status: response.data.status,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error:
        error.response?.data?.message || "Failed to fetch transaction status",
    });
  }
};

export const generateTransactionToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${process.env.MINT_PAYMENTS_API_URL}/transaction_token`,
      {
        company_token: "OPV79cuqKDaeWc3XOcDnqRH25Fx14R5",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MINT_PAYMENTS_BEARER_TOKEN}`,
        },
      }
    );
    return response.data.transaction_token;
  } catch (error) {
    throw error;
  }
};

// Controller to send response with the transaction token
export const createTransactionToken = async (req: Request, res: Response) => {
  try {
    const { cardToken, amount } = req.body;

    // Validation
    if (!cardToken) {
      return res.status(400).json({ error: "Card token is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Generate transaction token
    const transactionToken = await generateTransactionToken();

    return res.status(200).json({
      success: true,
      transactionToken,
    });
  } catch (error: any) {
    console.error("Error generating transaction token:", error);
    return res.status(500).json({
      success: false,
      error:
        error.response?.data?.message || "Failed to generate transaction token",
    });
  }
};

// STEP 3: Charge Customer with both tokens
export const chargeCustomer = async (req: Request, res: Response) => {
  try {
    const { amount, cardToken, description, customerEmail }: ChargeRequest =
      req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!cardToken) {
      return res.status(400).json({ error: "Card token is required" });
    }
    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    // Step 2: Generate transaction token
    console.log("Generating transaction token...");
    const transactionToken = await generateTransactionToken();

    // Step 3: Process final charge
    console.log("Processing final charge...");
    const response = await axios.post(
      `${process.env.MINT_PAYMENTS_API_URL}/charges`,
      {
        amount: Math.round(amount * 100), // Convert to cents
        token: cardToken, // From Step 1
        transaction_token: transactionToken, // From Step 2
        description: description || "Payment charge",
        email: customerEmail,
        currency: "AUD",
      },
      {
        auth: {
          username: process.env.MINT_PAYMENTS_API_KEY || "",
          password: process.env.MINT_PAYMENTS_SECRET_KEY || "",
        },
      }
    );

    return res.status(200).json({
      success: true,
      transaction: response.data,
    });
  } catch (error: any) {
    console.error("Mint Payments charge error:", error);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || "Payment processing failed",
    });
  }
};

/*
Complete Payment Flow:

1. Client calls POST /api/payments/tokenize
   Input: Card Details
   Output: cardToken

2. Client calls POST /api/payments/charge
   Input: {
     amount,
     cardToken,      // from step 1
     description,
     customerEmail
   }
   
   Server then:
   a) Generates transaction token internally
   b) Makes final charge with both tokens
   Output: Transaction result
*/
