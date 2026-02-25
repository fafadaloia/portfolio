import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';

export const login = async (email, password) => {
  if (!auth) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  if (!auth) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth ? auth.currentUser : null;
};

export const onAuthChange = (callback) => {
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
