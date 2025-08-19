import { db } from './firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...')
    
    // Test write
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: new Date()
    })
    console.log('Test document written with ID: ', testDoc.id)
    
    // Test read
    const querySnapshot = await getDocs(collection(db, 'test'))
    console.log('Test documents found:', querySnapshot.size)
    
    return true
  } catch (error) {
    console.error('Firebase connection test failed:', error)
    return false
  }
}
