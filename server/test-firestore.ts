import { initializeFirestore, createDefaultWorkLocations } from './initialize-firestore.js';
import { createDefaultAdmin } from './create-admin.js';
import { storage } from './firebase-storage.js';

async function testFirestoreConnection() {
  console.log('🧪 Testing Firebase Firestore connection and functionality...');
  
  try {
    // Initialize Firestore
    const isInitialized = await initializeFirestore();
    if (!isInitialized) {
      throw new Error('Failed to initialize Firestore');
    }

    // Test basic operations
    console.log('Testing basic CRUD operations...');
    
    // Test admin creation
    await createDefaultAdmin();
    
    // Test admin retrieval
    const admin = await storage.getUserByEmail('parahul270@gmail.com');
    if (!admin) {
      throw new Error('Failed to retrieve admin user');
    }
    console.log('✓ Admin user exists:', admin.email);

    // Test work locations
    await createDefaultWorkLocations();
    const locations = await storage.getWorkLocations();
    console.log(`✓ Found ${locations.length} work locations`);

    // Test attendance stats
    const stats = await storage.getAttendanceStats();
    console.log('✓ Attendance stats:', stats);

    // Test user list
    const users = await storage.getAllUsers();
    console.log(`✓ Found ${users.length} users in the system`);

    console.log('🎉 All Firestore tests passed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Work Locations: ${locations.length}`);
    console.log(`   - Active Employees: ${stats.totalEmployees}`);
    
    return true;
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirestoreConnection().then(() => process.exit(0));
}

export { testFirestoreConnection };