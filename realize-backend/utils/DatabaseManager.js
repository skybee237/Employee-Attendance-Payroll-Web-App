// utils/DatabaseManager.js

const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.databaseName = null;
  }

  extractDatabaseName(uri) {
    try {
      const match = uri.match(/mongodb:\/\/[^/]+\/([^?]+)/);
      if (match && match[1]) {
        return match[1];
      }
      return 'unknown';
    } catch (error) {
      console.error('❌ Error extracting database name:', error.message);
      return 'unknown';
    }
  }

  async connect(uri) {
    try {
      this.databaseName = this.extractDatabaseName(uri);

      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log(`✅ MongoDB connected successfully to database: ${this.databaseName}`);

      // Initialize with default data
      await this.initializeDatabase();

      // 🆕 Show existing admin details if any
      const admin = await this.getAdminDetails();
      if (admin) {
        console.log("🔍 Admin account found:");
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created At: ${admin.createdAt}`);
      }

    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error.message);
      throw error;
    }
  }

  async initializeDatabase() {
    try {
      await this.createDefaultAdmin();
      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization error:', error.message);
    }
  }

  async createDefaultAdmin() {
    try {
      const existingAdmin = await Employee.findOne({ email: "admin@admin.com" });
      const saltRounds = 10;
      const userPassword = '1234G@';
      console.log("hellooo")
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(userPassword, saltRounds);
        const admin = new Employee({
          name: "System Administrator",
          email: "admin@admin.com",
          password: hashedPassword,
          role: "admin"
        });

        await admin.save();
        console.log('🛠 Default admin created:');
        console.log('   Email: admin@admin.com');
        console.log('   Password: 1234G@');
        console.log('   Role: Administrator');
      } else {
        console.log('ℹ️ Admin account already exists');
      }
    } catch (error) {
      console.error('❌ Error creating admin:', error.message);
    }
  }

  async getAdminDetails() {
    try {
      const admin = await Employee.findOne({ email: "admin@admin.com" });

      if (admin) {
        return {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        };
      } else {
        console.log("❌ No admin account found.");
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching admin details:', error.message);
      throw error;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getDatabaseName() {
    return this.databaseName || 'Not connected';
  }

  async getDatabaseStats() {
    try {
      const stats = {
        database: this.databaseName,
        employees: await Employee.countDocuments(),
        admins: await Employee.countDocuments({ role: 'admin' }),
        superiors: await Employee.countDocuments({ role: 'superior' }),
        regularEmployees: await Employee.countDocuments({ role: 'employee' })
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting database stats:', error.message);
      throw error;
    }
  }

  async getDatabaseInfo() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);

      return {
        databaseName: this.databaseName,
        collections: collectionNames,
        totalCollections: collectionNames.length
      };
    } catch (error) {
      console.error('❌ Error getting database info:', error.message);
      throw error;
    }
  }
}

// ✅ Singleton instance export
const databaseManager = new DatabaseManager();
module.exports = databaseManager;
