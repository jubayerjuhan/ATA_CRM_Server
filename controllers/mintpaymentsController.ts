import { Request, Response } from "express";
import axios from "axios";

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

// STEP 1: Card Tokenization
export const tokenizeCard = async (req: Request, res: Response) => {
  try {
    const transactionToken = await generateTransactionToken();

    const cardDetails: CardDetails = req.body;
    // console.log(req.body, "req.body");

    const response = await axios.post(
      `${process.env.MINT_PAYMENTS_API_URL}/purchase`,
      {
        token: {
          company_token: "OPV79cuqKDaeWc3XOcDnqRH25Fx14R5",
          transaction_token: transactionToken,
        },
        customer: {
          reference: "987654321",
          email: "derap82027@aleitar.com",
          accepted_terms_conditions: "",
          ip_address: "203.99.145.252",
          timezone: "Australia/Sydney",
          store_card_permission: true,
          id: "",
          should_mint_apply_authentication: true,
          authentication_redirect_url: "https://www.google.com",
        },
        card: {
          token: "",
          number: "4777920801347503",
          expiry_month: "11",
          expiry_year: "32",
          cvc: "184",
          holder_name: "Jubayer Hossain",
        },
        purchase: {
          invoice_number: "5234234-John-Doe",
          amount: 1,
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

    // console.log("Card tokenization response:", response.data);

    return res.status(200).json({
      success: true,
      response: response.data,
    });
  } catch (error: any) {
    console.error("Card tokenization error:", error.response);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || "Card tokenization failed",
    });
  }
};

// STEP 2: Generate Transaction Token
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
