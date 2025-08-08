// File: scripts/createTestSubAdmin.js
// This is a demo script to show how sub-admin creation works
// In a real app, this would be done through the admin interface

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBkaEpBFuUizKnjl6LAt6FEx499pDHVPZs",
  authDomain: "vihar-app-f6b07.firebaseapp.com",
  projectId: "vihar-app-f6b07",
  storageBucket: "vihar-app-f6b07.firebasestorage.app",
  messagingSenderId: "768229718089",
  appId: "1:768229718089:web:e0fde908462429e731e798",
  measurementId: "G-441FJPXRL5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestSubAdmin() {
  try {
    // Create test sub-admin user
    const email = 'subadmin@test.com';
    const password = 'password123';
    const displayName = 'Test Sub Admin';
    
    console.log('Creating test sub-admin user...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    console.log('Created Firebase user with UID:', uid);
    
    // Create user document
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      displayName,
      role: 'sub-admin',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log('Created user document');
    
    // Create sub-admin document with permissions
    await setDoc(doc(db, 'subAdmins', uid), {
      uid,
      email,
      displayName,
      role: 'sub-admin',
      permissions: {
        dashboard: true,
        orders: true,
        delivery: false,
        products: true,
      },
      createdBy: 'admin-uid-placeholder', // In real app, this would be the actual admin UID
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });
    
    console.log('Created sub-admin document');
    console.log('Test sub-admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Permissions: Dashboard, Orders, Products');
    
  } catch (error) {
    console.error('Error creating test sub-admin:', error);
  }
}

// Uncomment the line below to run the script
// createTestSubAdmin();

console.log('Test sub-admin creation script ready.');
console.log('Uncomment the last line in the script to create a test sub-admin.');