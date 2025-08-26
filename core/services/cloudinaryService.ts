// core/services/cloudinaryService.ts
import * as ImagePicker from 'expo-image-picker';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dbfbbmy79';
const CLOUDINARY_UPLOAD_PRESET = 'vihar_products'; // Create this in your Cloudinary dashboard

// Optional picker options so callers can choose to crop or not
type PickerOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
};

// Function to pick an image from the device
export const pickImage = async (options?: PickerOptions) => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return null;
    }
    
    // Pick the image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Function to upload an image to Cloudinary
export const uploadToCloudinary = async (imageUri: string) => {
  try {
    // Create form data for the upload
    const formData = new FormData();
    
    // Append the file
    const filename = imageUri.split('/').pop() || 'image';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';
    
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
    
    // Add upload preset
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Upload to Cloudinary with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('Failed to get secure URL from Cloudinary');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    if (error.name === 'AbortError') {
      throw new Error('Upload timed out. Please try again.');
    }
    throw error;
  }
};

// Function to take a photo with the camera
export const takePhoto = async (options?: PickerOptions) => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return null;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};
