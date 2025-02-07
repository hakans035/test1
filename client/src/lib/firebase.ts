import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Function to check if user is admin with better error handling
export const isUserAdmin = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user currently logged in');
    return false;
  }

  try {
    // Force token refresh to get the latest claims
    await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult(true);
    console.log('Current user claims:', idTokenResult.claims);
    return idTokenResult.claims.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get current user's auth token
export const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
};

// Sign in with email/password with improved error handling
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // After successful sign in, check/set admin status
    const response = await fetch('/api/check-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await userCredential.user.getIdToken(true)}`
      },
      body: JSON.stringify({ 
        uid: userCredential.user.uid,
        email: userCredential.user.email 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error response from check-admin:', error);
      throw new Error(error.message || 'Failed to verify admin status');
    }

    // Force token refresh to get new claims
    await userCredential.user.getIdToken(true);
    const idTokenResult = await userCredential.user.getIdTokenResult(true);
    console.log('Updated claims after login:', idTokenResult.claims);

    return userCredential;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

// Sign up with email/password with improved error handling
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Check/set admin status for new users
    const response = await fetch('/api/check-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await userCredential.user.getIdToken(true)}`
      },
      body: JSON.stringify({ 
        uid: userCredential.user.uid,
        email: userCredential.user.email 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error response from check-admin:', error);
      throw new Error(error.message || 'Failed to set initial user role');
    }

    // Force token refresh to get new claims
    await userCredential.user.getIdToken(true);
    return userCredential;
  } catch (error: any) {
    console.error('Signup error:', error);
    throw error;
  }
};