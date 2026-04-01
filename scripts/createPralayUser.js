// scripts/createPralayUser.js

require("dotenv").config();
const connectDB = require("../config/user/UserDb.js"); // ✅ path same as your server file
const UserModel = require("../models/user/userModel.js");   // ✅ is path ko apne project ke hisaab se adjust kar

(async () => {
  try {
    // 1. DB connect
    await connectDB();
    console.log("✅ Database connected.");

    const email = "pralaychaudhary@gmail.com";

    // 2. Pehle check karo already user hai ya nahi
    let existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      console.log("⚠️ User already exists with this email.");
      console.log("User ID:", existingUser._id);
      process.exit(0);
    }

    // 3. Naya user create karo
    const newUser = await UserModel.create({
      firstName: "Pralay",
      lastName: "Chaudhary",
      email: "pralaychaudhary@gmail.com",
      phone: "+917044754826",
      country: "India",

      // TODO: yeh password tum apne hisaab se strong rakhna.
      // Agar tumhare project me password hash middleware hai (pre save hook),
      // to yahaan normal string chalegi.
      password: "Temp@1234", // ✅ user login password (temporary)

      accounts: [
        {
          accountNumber: "5565547",
          leverage: "1000",
          accountType: "Basic",                 // 👈 tumne diya hai "Basic"
          groupName: "AURO\\PRIME\\SIGNAL.1",   // 👈 backslash escape kiya hai
          masterPassword: "Master@1234",        // ✅ yeh change kar lena real master pwd se
          investorPassword: "Investor@1234",    // ✅ yeh bhi change kar lena
          platform: "MT5",                      // 👈 agar MT4 hai to MT4 kar dena
        },
      ],

      // Optional fields (agar chaho to fill kar sakte ho)
      state: "",
      city: "",
      zipCode: "",
      address: "",
      emailVerified: false,
      kycVerified: false,
      referralAccount: "",
      referralFromId: null,
      referralFromUserId: null,
    });

    console.log("✅ User created successfully:");
    console.log("ID:", newUser._id);
    console.log("Email:", newUser.email);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error while creating user:");
    console.error(err);
    process.exit(1);
  }
})();
