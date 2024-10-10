import mongoose, { Schema, Document } from "mongoose";

interface ILead extends Document {
  [key: string]: any; // Allows storing any key-value pair based on the fields
  createdAt: Date;
  claimed_by: string;
  converted: boolean;
}

const LeadSchema: Schema = new Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    pnr: {
      type: String,
    },
    leadOrigin: {
      type: String,
    },
    departure: {
      type: Schema.Types.ObjectId,
      ref: "Airport",
    },
    arrival: {
      type: Schema.Types.ObjectId,
      ref: "Airport",
    },
    claimed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    payment: {
      url: {
        type: String,
      },
      sessionId: {
        type: String,
      },
      amount: {
        type: Number,
      },
      currency: {
        type: String,
      },
      date: {
        type: Date,
      },
      status: {
        type: String,
        default: "pending",
      },
    },

    status: {
      type: String,
      enum: [
        "In Progress",
        "Itenary Email Sent",
        "Payment Link Sent",
        "Payment Complete",
        "Ticket Sent",
        "cancelled",
        "Sale Lost",
      ],
      default: "In Progress",
    },

    // email status
    itenary_email_sent: {
      type: Boolean,
      default: false,
    },

    call_logs: [
      {
        callType: {
          type: String,
          required: true,
        },
        notes: {
          type: String,
        },
        dateTime: {
          type: String,
          required: true,
        },
        added_by: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    selectedPaymentMethod: {
      type: String,
    },

    stripe_payment_link: {
      type: String,
    },

    cancelled: {
      type: Boolean,
      default: false,
    },

    follow_up_date: {
      type: Date,
    },

    // Quoted amount with dynamic fields like 'adult_1', 'adult_2', ..., 'child_1', 'infant_1', etc.
    quoted_amount: {
      type: Map,
      of: Number, // Each key-value pair will be a string (like 'adult_1') and a number (amount)
      default: { total: 0 }, // Default total amount
    },

    itinerary_amounts: {
      type: Object,
    },

    airline: {
      type: Schema.Types.ObjectId,
      ref: "Airline",
    },

    converted: {
      type: Boolean,
      default: false,
    },
    ticket_sent: {
      type: Boolean,
      default: false,
    },
    ticket_links: [
      {
        type: String,
      },
    ],
    booking_id: {
      type: String,
      unique: true,
    },

    saleLostReason: {
      type: String,
    },
    // Arbitrary key-value pairs for lead data
  },
  { strict: false }
);

const Lead = mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
