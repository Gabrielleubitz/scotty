import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';
import { teamService } from './teams';

const googleProvider = new GoogleAuthProvider();

// Convert Firebase user to our User type
const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Check if user document exists in Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: userData.name || firebaseUser.displayName || 'User',
      displayName: userData.displayName || userData.name || firebaseUser.displayName || 'User',
      avatarUrl: firebaseUser.photoURL || userData.avatarUrl || undefined,
      avatar: firebaseUser.photoURL || userData.avatar || undefined, // Legacy
      role: userData.role || 'user', // Legacy, use team memberships for actual permissions
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    };
  } else {
    // Create user document if it doesn't exist
    const now = new Date();
    const displayName = firebaseUser.displayName || 'User';
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: displayName,
      displayName,
      avatarUrl: firebaseUser.photoURL || undefined,
      avatar: firebaseUser.photoURL || undefined, // Legacy
      role: 'user', // Legacy
      createdAt: now,
      updatedAt: now,
    };
    
    const userDocData: any = {
      name: newUser.name,
      displayName: newUser.displayName,
      email: newUser.email,
      role: newUser.role,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    // Only include avatarUrl if it exists (Firestore doesn't allow undefined)
    if (newUser.avatarUrl) {
      userDocData.avatarUrl = newUser.avatarUrl;
    }
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
    
    return newUser;
  }
};

class AuthService {
  private listeners: Array<(user: User | null) => void> = [];
  private currentUser: User | null = null;

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = await convertFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await convertFirebaseUser(userCredential.user);
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user document in Firestore
    const now = new Date();
    const userDocData: any = {
      name,
      displayName: name,
      email,
      role: 'user', // Legacy role
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    // Only include avatarUrl if it exists (Firestore doesn't allow undefined)
    if (userCredential.user.photoURL) {
      userDocData.avatarUrl = userCredential.user.photoURL;
    }
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userDocData);
    
    const user = await convertFirebaseUser(userCredential.user);
    
    // Create default team for new user (with basic plan and trial status)
    try {
      await teamService.getOrCreateDefaultTeam(user.id, user.displayName);
    } catch (error) {
      console.error('Failed to create default team for new user:', error);
      // Don't fail signup if team creation fails
    }
    
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return await convertFirebaseUser(userCredential.user);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async makeUserAdmin(userId: string): Promise<void> {
    await setDoc(doc(db, 'users', userId), { role: 'admin' }, { merge: true });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();