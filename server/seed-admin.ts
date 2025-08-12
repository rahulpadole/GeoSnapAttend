import { storage } from "./firebase-storage";

async function createAdminUsers() {
  try {
    console.log("Creating admin users...");
    
    // Create admin user
    await storage.upsertUser({
      email: "admin@company.com",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      department: "IT",
    });

    // Create employee users for testing
    await storage.upsertUser({
      email: "john.doe@company.com",
      firstName: "John",
      lastName: "Doe",
      role: "employee",
      department: "Engineering",
    });

    await storage.upsertUser({
      email: "jane.smith@company.com",
      firstName: "Jane",
      lastName: "Smith",
      role: "employee",
      department: "Marketing",
    });

    console.log("Admin users created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin users:", error);
    process.exit(1);
  }
}

createAdminUsers();