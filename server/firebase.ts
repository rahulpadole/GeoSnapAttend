import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'geosnapattend'
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

export const db = admin.firestore();
export const auth = admin.auth();

// Collection names for Firebase Firestore
export const COLLECTIONS = {
  USERS: 'users',
  ATTENDANCE_RECORDS: 'attendanceRecords',
  WORK_LOCATIONS: 'workLocations',
  EMPLOYEE_INVITATIONS: 'employeeInvitations',
  PASSWORD_RESET_TOKENS: 'passwordResetTokens',
  SESSIONS: 'sessions'
} as const;

// Helper function to check Firestore connection
export async function checkFirestoreConnection() {
  try {
    const testDoc = await db.collection('_health_check').doc('test').get();
    console.log('✓ Firebase Firestore connection successful');
    return true;
  } catch (error: any) {
    if (error?.code === 7) {
      console.log('❌ Firestore API not enabled. Please enable it at:');
      console.log('https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=geosnapattend');
      return false;
    }
    console.log('❌ Firestore connection error:', error?.message);
    return false;
  }
}