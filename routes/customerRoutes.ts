import { Router, Request, Response } from "express";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

import { checkRole } from "../middlewares";
import {
  addQuotedAmount,
  getAllCustomers,
  getCustomersByDate,
  getUniqueCustomers,
  getUniqueCustomersPaginated,
  sendItineraryEmailController,
  sendTicketEmail,
} from "../controllers/customerController";
import multer from "multer";

// Create multer storage
const upload = multer({ storage: multer.memoryStorage() });

// Create a new router for auth routes
const router: Router = Router();

// Define the routes
router.route("/").get(checkRole(["admin", "agent"]), getAllCustomers);
router
  .route("/unique-customers")
  .get(checkRole(["admin", "agent"]), getUniqueCustomers);
router
  .route("/unique-customers-paginated")
  .get(checkRole(["admin", "agent"]), getUniqueCustomersPaginated);
router
  .route("/:id/add-quoted-amount")
  .put(checkRole(["admin", "agent"]), addQuotedAmount);
router
  .route("/:id/send-itinerary-email")
  .post(checkRole(["admin", "agent"]), sendItineraryEmailController);
router
  .route("/filter/converted")
  .get(checkRole(["admin", "agent"]), getCustomersByDate);
router
  .route("/ticket/send-ticket-email")
  .post(upload.array("ticket", 50), sendTicketEmail);

router.post("/payment/initialize", async (req, res) => {
  try {
    // Make request to Mintpay
    // const response = await axios.post(
    //   `https://private-anon-b331fb5574-mintmpayv5.apiary-mock.com/mpay/v5/purchase`,
    //   {
    //     token: {
    //       company_token: "OPV79cuqKDaeWc3XOcDnqRH25Fx14R5",
    //       transaction_token: "1f41ec36-4603-48a8-ba4d-e1a770faaceb",
    //     },
    //     customer: {
    //       reference: "987654321",
    //       email: "john.doe@test.com",
    //       accepted_terms_conditions: "",
    //       ip_address: "123.123.1.123",
    //       timezone: "Australia/Sydney",
    //       store_card_permission: true,
    //       id: "",
    //       should_mint_apply_authentication: true,
    //       authentication_redirect_url: "https://www.google.com",
    //     },
    //     card: {
    //       token: "",
    //       number: "4000002760003184",
    //       expiry_month: "02",
    //       expiry_year: "24",
    //       cvc: "123",
    //       holder_name: "John Doe",
    //     },
    //     purchase: {
    //       invoice_number: "5234234-John-Doe",
    //       amount: 100.5,
    //       should_mint_apply_surcharge: false,
    //       should_mint_apply_pre_authorisation: true,
    //       currency: "AUD",
    //     },
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer 31323e74-af4e-44d2-8c2b-52ab31d98a96`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    // c71a6ae0-51ee-4610-804f-d017f284a1d3
    const response = await axios.post(
      `https://private-anon-b331fb5574-mintmpayv5.apiary-mock.com/mpay/v5/transaction_token`,
      {
        company_token: "7qmtV8nn621vX5ptbUbFGUXj6EFzQbB",
      },
      {
        headers: {
          Authorization: `Bearer 31323e74-af4e-44d2-8c2b-52ab31d98a96`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data, "First Response");
    const resp = await axios.post(
      `https://webhook.site/9c4ab577-e9b1-4fbd-8fc8-1ea58eb7c29f`,
      {
        token: {
          company_token: "7qmtV8nn621vX5ptbUbFGUXj6EFzQbB",
          transaction_token: "c71a6ae0-51ee-4610-804f-d017f284a1d3",
        },
        customer: {
          reference: "987654321",
          email: "john.doe@test.com",
          accepted_terms_conditions: "",
          ip_address: "123.123.1.123",
          timezone: "Australia/Sydney",
          store_card_permission: true,
          id: "",
          should_mint_apply_authentication: true,
          authentication_redirect_url: "https://www.google.com",
        },
        card: {
          token: "",
          number: "4000002760003184",
          expiry_month: "02",
          expiry_year: "24",
          cvc: "123",
          holder_name: "John Doe",
        },
        purchase: {
          invoice_number: "5234234-John-Doe",
          amount: 100.5,
          should_mint_apply_surcharge: false,
          should_mint_apply_pre_authorisation: true,
          currency: "AUD",
        },
      },
      {
        headers: {
          Authorization: `Bearer 31323e74-af4e-44d2-8c2b-52ab31d98a96`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(resp.data, "Second Response");

    const thirdResp = await axios.post(
      `https://private-anon-b331fb5574-mintmpayv5.apiary-mock.com/mpay/v5/purchase/${resp.data.purchase.purchase_reference}/capture`,
      {
        token: {
          company_token: "7qmtV8nn621vX5ptbUbFGUXj6EFzQbB",
          transaction_token: "c71a6ae0-51ee-4610-804f-d017f284a1d3",
        },
        capture: {
          amount: 100.5,
          currency: "AUD",
          should_mint_apply_surcharge: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer 31323e74-af4e-44d2-8c2b-52ab31d98a96`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(thirdResp, "Third Response");
  } catch (error: any) {
    console.error("Mintpay payment error:", error);
    res.status(error.response?.status || 500).json({
      timestamp_utc: new Date().toISOString(),
      error_code: error.response?.data?.error_code || "processing_error",
      error_message:
        error.response?.data?.error_message ||
        "An error occurred while processing the payment",
      request_uri: req.originalUrl,
    });
  }
});

export default router;
