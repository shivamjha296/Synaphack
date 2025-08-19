import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export type UserRole = 'organizer' | 'participant' | 'judge'

export interface UserData {
  uid: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

export const authService = {
  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<UserData> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        return userDoc.data() as UserData
      } else {
        throw new Error('User data not found. Please contact support.')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in')
    }
  },

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, name: string, role: UserRole): Promise<UserData> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Create user data
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        name,
        role,
        createdAt: new Date()
      }
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), userData)
      
      return userData
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account')
    }
  },

  // Sign in with Google
  async signInWithGoogle(role: UserRole): Promise<UserData> {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData
      } else {
        // Create new user data
        const userData: UserData = {
          uid: user.uid,
          email: user.email!,
          name: user.displayName || user.email!.split('@')[0],
          role,
          createdAt: new Date()
        }
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), userData)
        
        return userData
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google')
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out')
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }
}
