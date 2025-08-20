// Cloudinary service for image upload and management
// Install: npm install cloudinary

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

export class CloudinaryService {
  private static get cloudName() {
    const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dozhkrrcg'
    console.log('Getting cloudName:', name)
    return name
  }
  
  private static get uploadPreset() {
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'hackathon_events'
    console.log('Getting uploadPreset:', preset)
    return preset
  }

  // Upload event image to Cloudinary
  static async uploadEventImage(file: File, eventId: string): Promise<string> {
    try {
      const cloudName = this.cloudName
      const uploadPreset = this.uploadPreset
      
      console.log('Cloudinary config check:', {
        cloudName,
        uploadPreset,
        hasCloudName: !!cloudName,
        hasUploadPreset: !!uploadPreset,
        envVars: {
          from_env_cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          from_env_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
        }
      })
      
      if (!cloudName || !uploadPreset) {
        throw new Error(`Cloudinary configuration missing: cloudName=${cloudName}, uploadPreset=${uploadPreset}`)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', 'events')
      
      console.log('Uploading to Cloudinary:', {
        url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        cloudName,
        uploadPreset,
        fileName: file.name,
        fileSize: file.size
      })

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          mode: 'cors',
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data: CloudinaryUploadResponse = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
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

  // Upload profile image
  static async uploadProfileImage(file: File, userId: string): Promise<string> {
    try {
      if (!this.cloudName || !this.uploadPreset) {
        throw new Error('Cloudinary configuration missing')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', this.uploadPreset)
      formData.append('folder', `profiles/${userId}`)
      formData.append('public_id', `${userId}_profile_${Date.now()}`)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data: CloudinaryUploadResponse = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Error uploading profile image:', error)
      throw new Error('Failed to upload profile image')
    }
  }

  // Upload submission files
  static async uploadSubmissionFile(file: File, eventId: string, userId: string): Promise<string> {
    try {
      if (!this.cloudName || (!this.uploadPreset)) {
        throw new Error('Cloudinary configuration missing')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', this.uploadPreset)
      formData.append('folder', `submissions/${eventId}/${userId}`)
      formData.append('public_id', `${userId}_submission_${Date.now()}`)
      formData.append('resource_type', 'auto') // Allows any file type

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data: CloudinaryUploadResponse = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Error uploading submission file:', error)
      throw new Error('Failed to upload file')
    }
  }

  // Delete image by public_id (requires API key - backend only)
  static async deleteImage(publicId: string): Promise<void> {
    // This should be implemented on the backend with API key
    console.warn('Image deletion requires backend implementation with API keys')
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB (Cloudinary free tier limit)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)'
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size should be less than 10MB'
      }
    }

    return { isValid: true }
  }

  // Generate optimized image URL with transformations
  static getOptimizedImageUrl(
    url: string, 
    width?: number, 
    height?: number, 
    quality?: number
  ): string {
    if (!url.includes('cloudinary.com')) {
      return url // Return original if not a Cloudinary URL
    }

    const transformations = []
    
    if (width || height) {
      transformations.push(`c_fill`)
      if (width) transformations.push(`w_${width}`)
      if (height) transformations.push(`h_${height}`)
    }
    
    if (quality) {
      transformations.push(`q_${quality}`)
    }

    // Add auto format and quality optimizations
    transformations.push('f_auto', 'q_auto')

    if (transformations.length === 0) {
      return url
    }

    // Insert transformations into the Cloudinary URL
    const transformString = transformations.join(',')
    return url.replace('/upload/', `/upload/${transformString}/`)
  }

  // Compress and resize image before upload (client-side)
  static async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
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
