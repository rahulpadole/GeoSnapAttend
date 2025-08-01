import { storage } from "./storage";

async function createAdminUsers() {
  try {
    console.log("Creating admin users...");
    
    // Create admin user
    await storage.upsertUser({
      id: "admin-001",
      email: "admin@company.com",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      department: "IT",
    });

    // Create employee users for testing
    await storage.upsertUser({
      id: "emp-001",
      email: "john.doe@company.com",
      firstName: "John",
      lastName: "Doe",
      role: "employee",
      department: "Engineering",
    });

    await storage.upsertUser({
      id: "emp-002",
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