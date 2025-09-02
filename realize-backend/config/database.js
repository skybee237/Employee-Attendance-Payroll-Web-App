const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.databaseName = null;
  }

  async connectDB() {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      this.isConnected = true;
      this.databaseName = conn.connection.name;
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${this.databaseName}`);
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);
      process.exit(1);
    }
  }

  // Create default admin if not exists
  // async createDefaultAdmin() {
  //   try {
  //     const existingAdmin = await Employee.findOne({ role: "admin" });

  //     if (!existingAdmin) {
  //       const hashedPassword = await bcrypt.hash("1234G@", 10);
  //       const admin = new Employee({
  //         name: "System Administrator2",
  //         email: "admin@admin.com",
  //         password: hashedPassword,
  //         role: "admin",
  //       });

  //       await admin.save();

  //       // console.log("🛠 Default admin created:");
  //       // console.log("   Email: admin@company.com");
  //       // console.log("   Password: 2001Godwin@");
  //       // console.log("   Role: Administrator");
  //     } else {
  //       console.log("ℹ️ Admin account already exists");
  //     }
  //   } catch (error) {
  //     console.error("❌ Error creating admin:", error.message);
  //   }
  // }

  // Get admin details
  async getAdminDetails() {
    try {
      const admin = await Employee.findOne({ role: "admin" });

      if (admin) {
        return {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        };
      } else {
        console.log("❌ No admin account found.");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching admin details:", error.message);
      throw error;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getDatabaseName() {
    return this.databaseName || "Not connected";
  }

  async getDatabaseStats() {
    try {
      return {
        database: this.databaseName,
        employees: await Employee.countDocuments(),
        admins: await Employee.countDocuments({ role: "admin" }),
        superiors: await Employee.countDocuments({ role: "superior" }),
        regularEmployees: await Employee.countDocuments({ role: "employee" }),
      };
    } catch (error) {
      console.error("❌ Error getting database stats:", error.message);
      throw error;
    }
  }

  async getDatabaseInfo() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map((col) => col.name);

      return {
        databaseName: this.databaseName,
        collections: collectionNames,
        totalCollections: collectionNames.length,
      };
    } catch (error) {
      console.error("❌ Error getting database info:", error.message);
      throw error;
    }
  }
}

// Singleton instance
const databaseManager = new DatabaseManager();
module.exports = databaseManager;
