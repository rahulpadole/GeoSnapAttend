import { db, COLLECTIONS, checkFirestoreConnection } from './firebase.js';
import { storage } from './firebase-storage.js';
import { nanoid } from 'nanoid';

export async function initializeFirestore() {
  try {
    console.log('🔥 Initializing Firebase Firestore...');
    
    // Check connection first
    const isConnected = await checkFirestoreConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Firestore');
    }

    // Create necessary indices and collections with sample documents to initialize them
    await createCollections();
    
    console.log('✅ Firebase Firestore initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
    return false;
  }
}

async function createCollections() {
  // Initialize collections by creating temporary documents and then deleting them
  // This ensures the collections exist and any necessary indices are created
  
  const collections = [
    COLLECTIONS.USERS,
    COLLECTIONS.ATTENDANCE_RECORDS,
    COLLECTIONS.WORK_LOCATIONS,
    COLLECTIONS.EMPLOYEE_INVITATIONS,
    COLLECTIONS.PASSWORD_RESET_TOKENS,
    COLLECTIONS.SESSIONS
  ];

  for (const collectionName of collections) {
    try {
      const tempId = `temp_${nanoid()}`;
      const tempDoc = {
        _temp: true,
        createdAt: new Date(),
        id: tempId
      };

      // Create temporary document
      await db.collection(collectionName).doc(tempId).set(tempDoc);
      
      // Delete temporary document
      await db.collection(collectionName).doc(tempId).delete();
      
      console.log(`✓ Collection '${collectionName}' initialized`);
    } catch (error) {
      console.log(`⚠️  Warning: Could not initialize collection '${collectionName}':`, error);
    }
  }
}

// Create default work locations if they don't exist
export async function createDefaultWorkLocations() {
  try {
    const existingLocations = await storage.getWorkLocations();
    
    if (existingLocations.length === 0) {
      console.log('Creating default work locations...');
      
      const defaultLocations = [
        {
          name: 'Main Office',
          address: '123 Business St, Business City, BC 12345',
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 100,
          isActive: true
        },
        {
          name: 'Branch Office',
          address: '456 Corporate Ave, Corporate City, CC 67890',
          latitude: 34.0522,
          longitude: -118.2437,
          radius: 150,
          isActive: true
        }
      ];

      for (const location of defaultLocations) {
        await storage.createWorkLocation(location);
        console.log(`✓ Created work location: ${location.name}`);
      }
    }
  } catch (error) {
    console.error('Error creating default work locations:', error);
  }
}