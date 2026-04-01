const mongoose = require("mongoose");

// Define the schema for user accounts
const accountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
    },
    leverage: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      required: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    masterPassword: {
      type: String,
      required: true,
    },
    investorPassword: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
    },
  },
  { timestamps: true }
);

// Define the schema for wallet details
const walletDetailsSchema = new mongoose.Schema({
  tetherAddress: {
    type: String,
  },
  ethAddress: {
    type: String,
  },
  trxAddress: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
});

// Define the schema for bank details
const bankDetailsSchema = new mongoose.Schema({
  bankName: {
    type: String,
  },
  holderName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  ifscCode: {
    type: String,
  },
  swiftCode: {
    type: String,
  },
  upiId: {
    type: String,
  },
  comment: {
    type: String,
  },
});

// Define the schema for KYC details
const kycDetailsSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
    },
    countryOfIssue: {
      type: String,
    },
    purpose: {
      type: String,
    },
    occupation: {
      type: String,
    },
    frontSideOfDocument: {
      type: String,
    },
    backSideOfDocument: {
      type: String,
    },
    selfieWithDocument: {
      type: String,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Define the main user schema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },
    accounts: [accountSchema], // Use the accountSchema for nested accounts
    referralAccount: {
      type: String,
    },
    referralFromId: {
      type: String,
      default: null,
    },
    referralFromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    walletDetails: walletDetailsSchema, // Embed wallet details schema
    bankDetails: bankDetailsSchema, // Embed bank details schema
    kycDetails: kycDetailsSchema, // Embed KYC details schema
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    role: {
    type: String,
    enum: ["users", "admin_users", "superadminusers"],//table name 
    default: "users",
  },

    ibBalance: {
      type: Number,
      min: [0, "Balance cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "ibBalance must be a valid number",
      },
      set: (v) => Math.round(v * 10000) / 10000, // ✅ force 4 decimal precision
    },


    token: {
  type: String,
  default: null,
},
tokenExpiry: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.models.User || mongoose.model("user", userSchema);

module.exports = UserModel;
