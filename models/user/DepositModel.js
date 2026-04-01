const mongoose = require("mongoose");

const payNowInvoiceCreateSchema = new mongoose.Schema(
  {
    id: { type: String, index: true }, // "4686795870"
    token_id: { type: String }, // "5687802260"
    order_id: { type: String, index: true }, // your orderId (uuid)
    order_description: { type: String },

    price_amount: { type: Number }, // "50" -> cast to 50
    price_currency: { type: String }, // "USD"
    pay_currency: { type: String, default: null }, // may be null if user chooses on page

    ipn_callback_url: { type: String, default: null },
    invoice_url: { type: String }, // hosted payment url
    success_url: { type: String, default: null },
    cancel_url: { type: String, default: null },
    customer_email: { type: String, default: null },
    partially_paid_url: { type: String, default: null },
    payout_currency: { type: String, default: null },

    created_at: { type: Date }, // ISO
    updated_at: { type: Date },

    is_fixed_rate: { type: Boolean, default: false },
    is_fee_paid_by_user: { type: Boolean, default: false },
    source: { type: mongoose.Schema.Types.Mixed, default: null },
    collect_user_data: { type: Boolean, default: false },
  },
  { _id: false, strict: true }
);

const payNowStatusSchema = new mongoose.Schema(
  {
    // bookkeeping
    eventReceivedAt: { type: Date, default: Date.now },

    // common IPN fields (covering invoice/payment updates)
    payment_id: { type: Number }, // NOW payment id
    invoice_id: { type: String }, // NOW invoice id (same as create id)
    payment_status: { type: String }, // waiting|confirming|confirmed|finished|expired|failed|refunded|partially_paid
    order_id: { type: String },
    order_description: { type: String },

    price_amount: { type: Number },
    price_currency: { type: String },
    pay_amount: { type: Number },
    pay_currency: { type: String },

    amount_received: { type: Number },
    actually_paid: { type: Number }, // sometimes present
    pay_address: { type: String },
    purchase_id: { type: Number },
    transaction_id: { type: String },
    network: { type: String },
    ipn_type: { type: String }, // "invoice" | "payment" | etc.

    // raw payload fallback (keeps anything we didn't model)
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, strict: false }
);

const payNowSchema = new mongoose.Schema(
  {
    // Response returned by POST /v1/invoice
    paynowCreateInvoiceResponse: payNowInvoiceCreateSchema,

    // The latest IPN event (for quick reads)
    paynowStatusChangedResponse: payNowStatusSchema,

    // Full event history (append-only)
    paynowStatusHistory: { type: [payNowStatusSchema], default: [] },

    // 🔹 Payment-level fields (from IPN)
    nowPaymentId: { type: String }, // from IPN (payment_id)
    payAddress: { type: String }, // crypto deposit address
    payAmount: { type: Number }, // actual crypto amount
    payCurrency: { type: String }, // crypto type (BTC, ETH, etc.)

    // 🔹 NOWPayments invoice-related fields
    orderId: { type: String }, // UUID we generate
    currency: { type: String, default: "USD" },
    nowInvoiceId: { type: String },
    nowInvoiceUrl: { type: String },
    nowOrderId: { type: String },
    nowPriceAmount: { type: Number },
    nowPriceCurrency: { type: String },
    nowPayCurrency: { type: String },
    nowIsFixedRate: { type: Boolean, default: false },
    nowIsFeePaidByUser: { type: Boolean, default: false },
    nowLastStatus: {
      type: String,
      default: "invoice_created",
    },

    // 🔹 Extra tracking
    invoiceCreatedAt: { type: Date },
    invoiceUpdatedAt: { type: Date },
    lastIpnReceivedAt: { type: Date },
  },
  { _id: false, strict: true }
);

const transactionSchema = new mongoose.Schema(
  {
    // 🔹 Core deposit fields
    mt5Account: {
      type: String,
      required: true,
      trim: true,
    },
    deposit: {
      type: String, // could be Number if you always store numeric
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    accountType: {
      type: String,
      required: true,
    },
    depositSS: {
      type: String, // uploaded slip file path
    },
    bonus: {
      type: String,
    },
    method: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
    },
    orderId: { type: String }, // UUID we generate

    payNowResponse: payNowSchema,
  },
  { timestamps: true }
);

const DepositModel = mongoose.model("deposit", transactionSchema);

module.exports = DepositModel;
