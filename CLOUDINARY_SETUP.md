# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image storage in your hackathon platform.

## Why Cloudinary?

We switched from Firebase Storage to Cloudinary because:
- Firebase Storage requires a paid plan for external requests (CORS issues)
- Cloudinary offers 25GB storage and 25GB bandwidth for free
- Better image optimization and transformation features
- Easier client-side upload implementation

## Setup Steps

### 1. Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials
After logging in to your Cloudinary dashboard:
1. Go to the **Dashboard** tab (should be the default view)
2. You'll see your account details with:
   - **Cloud name** (e.g., `your-cloud-name`)
   - **API Key** (not needed for frontend)
   - **API Secret** (not needed for frontend)

### 3. Create an Upload Preset
1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `hackathon_events` (or any name you prefer)
   - **Signing Mode**: Select **Unsigned** (this allows frontend uploads)
   - **Folder**: `events` (optional, organizes uploaded images)
   - **Resource Type**: `Image`
   - **Access Type**: `Public`
   - **Allowed Formats**: `jpg,png,webp,gif`
   - **Max File Size**: `10485760` (10MB in bytes)
   - **Max Image Width**: `1920` (optional, for optimization)
   - **Max Image Height**: `1080` (optional, for optimization)
5. Click **Save**

### 4. Configure Environment Variables
1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Cloudinary credentials:
   ```env
   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=hackathon_events
   ```

   Replace:
   - `your-cloud-name` with your actual cloud name from step 2
   - `hackathon_events` with your upload preset name from step 3

### 5. Restart the Development Server
```bash
npm run dev
```

## Testing the Image Upload

1. Navigate to the **Events** page in your app
2. Try creating a new event
3. Use the image upload component to upload an event image
4. The image should upload successfully and display in the event cards

## Features Implemented

### Image Upload Component
- Drag and drop interface
- File validation (JPEG, PNG, WebP, GIF up to 10MB)
- Image preview before upload
- Upload progress indicator
- Client-side image compression

### Event Cards with Images
- Event images display in all dashboard views
- Fallback placeholder for events without images
- Responsive design across all screen sizes
- Optimized image loading with Cloudinary transformations

### Cloudinary Service Features
- Event image uploads
- Profile image uploads (ready for future use)
- Submission file uploads (ready for future use)
- Automatic image optimization
- URL transformations for different sizes

## Troubleshooting

### Upload Fails
- Check that your cloud name and upload preset are correct in `.env.local`
- Ensure the upload preset is set to "Unsigned"
- Verify the file meets the size and format requirements

### Images Don't Display
- Check browser console for any error messages
- Verify the image URLs are being saved correctly in the database
- Ensure the Cloudinary URLs are accessible

### CORS Issues
- This shouldn't happen with Cloudinary's free tier
- If you see CORS errors, verify your upload preset configuration

## Free Tier Limits

Cloudinary free tier includes:
- 25GB storage
- 25GB monthly bandwidth
- 1000 transformations per month
- Basic image and video features

This should be more than enough for a hackathon platform!

## Security Notes

- Upload presets are configured as "unsigned" for frontend uploads
- Consider implementing server-side validation for production
- File size and format restrictions are enforced client-side
- Consider adding moderation features for production use
