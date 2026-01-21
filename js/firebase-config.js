// ============================================
// FIREBASE CONFIGURATION
// ============================================

// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase SDK not loaded! Make sure Firebase scripts are loaded before app.js');
  alert('Feil: Firebase kunne ikke lastes. Vennligst last inn siden på nytt.');
  throw new Error('Firebase SDK not loaded');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAdsBb-RR200g_KVfV4t0dbRhk7dfWseG8',
  authDomain: 'handballstats-c80f3.firebaseapp.com',
  projectId: 'handballstats-c80f3',
  storageBucket: 'handballstats-c80f3.firebasestorage.app',
  messagingSenderId: '748340756980',
  appId: '1:748340756980:web:0d819c771d6bcde824f9a1'
};

// Initialize Firebase (using compat version for easier integration)
try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  alert('Feil ved Firebase-initialisering: ' + error.message);
  throw error;
}

// Export Firebase services
export const auth = firebase.auth();
export const db = firebase.firestore();

// Enable Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Firestore persistence not available in this browser');
    } else {
      console.error('❌ Firestore persistence error:', err);
    }
  });

console.log('✅ Firebase Auth and Firestore ready');
