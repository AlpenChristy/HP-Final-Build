// Test script for sub-admin password change functionality
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testSubAdminPasswordChange() {
  try {
    

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSubAdminPasswordChange();
