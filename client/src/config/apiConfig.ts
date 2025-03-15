/**
 * API Configuration
 * 
 * This file contains configuration for API endpoints and image URLs
 * to ensure they work correctly in both development and production environments.
 */

// Determine if we're in production or development
const isProduction = process.env.NODE_ENV === 'production';

// Base URL for API requests
export const API_BASE_URL = isProduction ? '' : 'http://localhost:5001';

// Base URL for image paths
export const IMAGE_BASE_URL = isProduction ? '' : '';

/**
 * Get the full URL for an image path
 * @param imagePath - The relative image path (e.g., /uploads/bollards/image.jpg)
 * @returns The complete URL for the image
 */
export const getImageUrl = (imagePath: string): string => {
  // If the path is already a full URL, return it as is
  if (imagePath?.startsWith('http')) {
    return imagePath;
  }
  
  // Otherwise, prepend the base URL
  return `${IMAGE_BASE_URL}${imagePath}`;
};

export default {
  API_BASE_URL,
  IMAGE_BASE_URL,
  getImageUrl
}; 