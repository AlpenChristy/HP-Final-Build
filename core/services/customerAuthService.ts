// File: core/services/customerAuthService.ts
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_DB } from '../firebase/firebase';
import { SessionManager, UserSession } from '../session/sessionManager';

export const customerAuthService = {
  // Login via phone + password (custom auth for customers)
  async authenticateByPhone(phoneNumber: string, password: string): Promise<UserSession | null> {
    const usersQuery = query(
      collection(FIREBASE_DB, 'users'),
      where('phoneNumber', '==', phoneNumber),
      where('role', '==', 'customer')
    );

    const usersSnapshot = await getDocs(usersQuery);
    if (usersSnapshot.empty) throw new Error('Invalid phone or password');

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data() as any;

    if (userData.password !== password) throw new Error('Invalid phone or password');
    if (userData.isActive === false) throw new Error('Your account has been deactivated. Please contact support.');

    const session: UserSession = {
      uid: userDoc.id,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      displayName: userData.displayName,
      role: userData.role || 'customer',
      sessionToken: SessionManager.generateSessionToken(),
      loginTime: Date.now(),
    };

    return session;
  },

  // Register via phone + password (no Firebase Auth user)
  async registerWithPhone(displayName: string, phoneNumber: string, password: string): Promise<{ uid: string }> {
    // Ensure phone uniqueness for customers
    const usersQuery = query(
      collection(FIREBASE_DB, 'users'),
      where('phoneNumber', '==', phoneNumber),
      where('role', '==', 'customer')
    );
    const existing = await getDocs(usersQuery);
    if (!existing.empty) throw new Error('This phone number is already registered.');

    const now = Date.now();
    const docRef = await addDoc(collection(FIREBASE_DB, 'users'), {
      displayName,
      phoneNumber,
      password, // NOTE: Plaintext per existing delivery flow. Consider hashing in production.
      role: 'customer',
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });

    return { uid: docRef.id };
  },
};
