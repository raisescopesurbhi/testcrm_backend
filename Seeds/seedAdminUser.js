const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const AdminUser = require("../models/admin/adminUserModel"); // Adjust the path

async function seedAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");

    // Check if an admin already exists
    const existingAdmin = await AdminUser.findOne({
      email: "admin@example.com",
    });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists:", existingAdmin.email);
      return;
    }

    // Create hashed password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const admin = new AdminUser({
      email: "admin@example.com",
      password: hashedPassword,
    });

    await admin.save();
    console.log("✅ Admin user created:", admin.email);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  } finally {
    mongoose.connection.close();
  }
}

seedAdminUser();
