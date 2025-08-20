// Quick debug script to check environment variables
console.log('Environment Variables Debug:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
console.log('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)
console.log('All NEXT_PUBLIC env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')))
