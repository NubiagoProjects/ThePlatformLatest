import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  deleteUser,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// User interface
export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'USER' | 'SUPPLIER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth error interface
export interface AuthErrorWithCode extends AuthError {
  code: string;
}

// Sign up function
export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  role: 'USER' | 'SUPPLIER' | 'ADMIN' = 'USER'
): Promise<FirebaseUser> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName,
    });

    // Create user document in Firestore
    const userData: Omit<FirebaseUser, 'uid'> = {
      email: user.email!,
      displayName,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return {
      uid: user.uid,
      ...userData,
    };
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Sign in function
export const signIn = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data() as Omit<FirebaseUser, 'uid'>;

    if (!userData.isActive) {
      throw new Error('Account is deactivated');
    }

    return {
      uid: user.uid,
      ...userData,
    };
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Sign out function
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Get current user
export const getCurrentUser = async (): Promise<FirebaseUser | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as Omit<FirebaseUser, 'uid'>;
    return {
      uid: user.uid,
      ...userData,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<FirebaseUser>
): Promise<FirebaseUser> => {
  try {
    const userRef = doc(db, 'users', uid);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(userRef, updateData);

    const updatedDoc = await getDoc(userRef);
    const userData = updatedDoc.data() as Omit<FirebaseUser, 'uid'>;

    return {
      uid,
      ...userData,
    };
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
};

// Delete user account
export const deleteUserAccount = async (uid: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Delete user document
    await deleteDoc(doc(db, 'users', uid));

    // Delete Firebase auth user
    await deleteUser(user);
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Password reset
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Confirm password reset
export const confirmPasswordResetWithCode = async (
  code: string,
  newPassword: string
): Promise<void> => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Change password
export const changePassword = async (newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    await updatePassword(user, newPassword);
  } catch (error) {
    throw handleAuthError(error as AuthErrorWithCode);
  }
};

// Auth state listener
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<FirebaseUser, 'uid'>;
          callback({
            uid: user.uid,
            ...userData,
          });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// Error handler
const handleAuthError = (error: AuthErrorWithCode): Error => {
  switch (error.code) {
    case 'auth/user-not-found':
      return new Error('No account found with this email address');
    case 'auth/wrong-password':
      return new Error('Incorrect password');
    case 'auth/email-already-in-use':
      return new Error('An account with this email already exists');
    case 'auth/weak-password':
      return new Error('Password should be at least 6 characters');
    case 'auth/invalid-email':
      return new Error('Invalid email address');
    case 'auth/user-disabled':
      return new Error('This account has been disabled');
    case 'auth/too-many-requests':
      return new Error('Too many failed attempts. Please try again later');
    case 'auth/network-request-failed':
      return new Error('Network error. Please check your connection');
    default:
      return new Error(error.message || 'Authentication failed');
  }
}; 