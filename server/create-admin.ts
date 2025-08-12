import { storage } from "./firebase-storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createDefaultAdmin() {
  try {
    console.log("Creating default admin user...");
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail("parahul270@gmail.com");
    if (existingAdmin) {
      console.log("Admin user already exists!");
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword("Rahul@2004");
    
    // Create admin user
    const adminUser = await storage.upsertUser({
      email: "parahul270@gmail.com",
      password: hashedPassword,
      firstName: "Rahul",
      lastName: "Padole",
      role: "admin",
      department: "Administration",
      position: "System Administrator",
      isActive: true,
    });

    console.log("✓ Default admin user created successfully!");
    console.log("✓ Email: parahul270@gmail.com");
    console.log("✓ Password: Rahul@2004");
    console.log("✓ Can also login with Google");
    console.log("✓ User ID:", adminUser.id);
    
  } catch (error: any) {
    if (error?.message?.includes('Cloud Firestore API has not been used') || error?.code === 7) {
      console.log("⚠️  Firebase Firestore API needs to be enabled first.");
      console.log("📝 Please follow these steps:");
      console.log("1. Visit: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=geosnapattend");
      console.log("2. Click 'Enable' button");
      console.log("3. Wait a few minutes for the API to activate");
      console.log("4. Restart this application");
      throw error;
    }
    console.error("Error creating default admin:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultAdmin().then(() => process.exit(0));
}

export { createDefaultAdmin };