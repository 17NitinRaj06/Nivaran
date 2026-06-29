import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { createWelcomeNotification } from '../services/notificationsService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser) => {
    if (!firebaseUser) { setUserData(null); return; }
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        const newUser = {
          name: firebaseUser.displayName || firebaseUser.phoneNumber || 'Anonymous',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || '',
          photoURL: firebaseUser.photoURL || '',
          role: 'citizen',
          state: '',
          city: '',
          area: '',
          points: 0,
          badges: [],
          reportsCount: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(docRef, newUser);
        createWelcomeNotification(firebaseUser.uid, newUser.name);
        setUserData(newUser);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await fetchUserData(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email || '';
        const linkErr = new Error('EMAIL_EXISTS');
        linkErr.email = email;
        throw linkErr;
      }
      throw err;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      throw err;
    }
  };

  const signUpWithEmail = async (name, email, password, role = 'citizen', state = '', city = '', area = '') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      const newUser = {
        name,
        email,
        phone: '',
        photoURL: '',
        role,
        state,
        city,
        area,
        points: 0,
        badges: [],
        reportsCount: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', result.user.uid), newUser);
      createWelcomeNotification(result.user.uid, name);
      await sendEmailVerification(result.user);
      return result.user;
    } catch (err) {
      throw err;
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No user signed in');
    await sendEmailVerification(auth.currentUser);
  };

  const reloadUser = async () => {
    if (!auth.currentUser) throw new Error('No user signed in');
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
    return auth.currentUser.emailVerified;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (err) {
      throw err;
    }
  };

  const userRole = userData?.role || 'citizen';
  const isOfficer = userRole === 'officer' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const value = {
    user,
    userData,
    loading,
    userRole,
    isOfficer,
    isAdmin,
    refreshUserData: () => fetchUserData(user),
    signInWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resendVerificationEmail,
    reloadUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
