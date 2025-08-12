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

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  ATTENDANCE_RECORDS: 'attendanceRecords',
  WORK_LOCATIONS: 'workLocations',
  EMPLOYEE_INVITATIONS: 'employeeInvitations',
  PASSWORD_RESET_TOKENS: 'passwordResetTokens',
  SESSIONS: 'sessions'
} as const;