// ============================================
// FIREBASE CONFIGURATION
// ============================================

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdsBb-RR200g_KVfV4t0dbRhk7dfWseG8",
  authDomain: "handballstats-c80f3.firebaseapp.com",
  projectId: "handballstats-c80f3",
  storageBucket: "handballstats-c80f3.firebasestorage.app",
  messagingSenderId: "748340756980",
  appId: "1:748340756980:web:0d819c771d6bcde824f9a1"
};

// Initialize Firebase (using compat version for easier integration)
firebase.initializeApp(firebaseConfig);

// Export Firebase services
export const auth = firebase.auth();
export const db = firebase.firestore();

// Enable Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser');
    }
  });

console.log('✅ Firebase initialized successfully');
