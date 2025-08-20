import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export class StorageService {
  // Upload event image
  static async uploadEventImage(file: File, eventId: string): Promise<string> {
    try {
      // Create a reference to the file location
      const imageRef = ref(storage, `events/${eventId}/${file.name}`)
      
      // Upload the file
      const snapshot = await uploadBytes(imageRef, file)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Failed to upload image')
    }
  }

  // Upload multiple images for an event
  static async uploadEventImages(files: File[], eventId: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadEventImage(file, eventId))
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading multiple images:', error)
      throw new Error('Failed to upload images')
    }
  }

  // Delete an image
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl)
      await deleteObject(imageRef)
    } catch (error) {
      console.error('Error deleting image:', error)
      throw new Error('Failed to delete image')
    }
  }

  // Upload user profile image
  static async uploadProfileImage(file: File, userId: string): Promise<string> {
    try {
      const imageRef = ref(storage, `profiles/${userId}/${file.name}`)
      const snapshot = await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error('Error uploading profile image:', error)
      throw new Error('Failed to upload profile image')
    }
  }

  // Upload submission images/files
  static async uploadSubmissionFile(file: File, eventId: string, userId: string): Promise<string> {
    try {
      const fileRef = ref(storage, `submissions/${eventId}/${userId}/${file.name}`)
      const snapshot = await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error('Error uploading submission file:', error)
      throw new Error('Failed to upload submission file')
    }
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size should be less than 5MB'
      }
    }

    return { isValid: true }
  }

  // Compress image before upload (basic client-side compression)
  static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 1200px width)
        const maxWidth = 1200
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }
}
