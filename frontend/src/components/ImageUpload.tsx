'use client'

import { useState, useRef } from 'react'
import { CloudinaryService } from '../lib/cloudinaryService'

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  currentImage?: string
  eventId?: string
  className?: string
  disabled?: boolean
}

const ImageUpload = ({ 
  onImageUploaded, 
  currentImage, 
  eventId = 'temp', 
  className = '',
  disabled = false 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (disabled) return

    // Validate file
    const validation = CloudinaryService.validateImageFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    setUploading(true)
    try {
      // Show preview immediately
      const tempUrl = URL.createObjectURL(file)
      setPreviewUrl(tempUrl)

      // Debug environment variables
      console.log('Debug - Environment check:', {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC'))
      })

      // Compress image
      const compressedFile = await CloudinaryService.compressImage(file, 1200, 0.8)
      
      // Upload to Cloudinary
      const imageUrl = await CloudinaryService.uploadEventImage(compressedFile, eventId)
      
      // Clean up temp URL
      URL.revokeObjectURL(tempUrl)
      
      // Update preview with actual URL and notify parent
      setPreviewUrl(imageUrl)
      onImageUploaded(imageUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
      setPreviewUrl(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveImage = async () => {
    if (disabled) return
    
    try {
      // Note: Cloudinary image deletion requires backend implementation
      // For now, we'll just remove it from the UI
      setPreviewUrl(null)
      onImageUploaded('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error removing image:', error)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Event preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-cyan-500/30"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2 text-white">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                <span>Uploading...</span>
              </div>
            </div>
          )}
          {!disabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                disabled={uploading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all
            flex flex-col items-center justify-center space-y-2
            ${dragOver 
              ? 'border-cyan-400 bg-cyan-500/10' 
              : 'border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/5'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="text-cyan-300 text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div className="text-center">
                <p className="text-cyan-300 font-medium">Upload Event Image</p>
                <p className="text-blue-200 text-sm">Drag & drop or click to select</p>
                <p className="text-cyan-300 text-xs mt-1">PNG, JPG, WebP, GIF up to 10MB</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
