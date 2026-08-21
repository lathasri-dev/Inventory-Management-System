const logger = require('../utils/logger');

let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
} catch (error) {
  logger.warn('Cloudinary package not installed. Image uploads will fall back to Base64.');
}

// Check if credentials are set
const isConfigured = 
  cloudinary &&
  process.env.CLOUDINARY_NAME && 
  process.env.CLOUDINARY_NAME !== 'your-cloudinary-name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your-api-key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your-api-secret';

if (isConfigured) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    logger.info('☁️ Cloudinary configured successfully.');
  } catch (err) {
    logger.error('Failed to initialize Cloudinary config:', err.message);
  }
} else {
  logger.warn('☁️ Cloudinary is not configured or package is missing. Fallback mode: Storing images as Base64 strings.');
}

/**
 * Upload an image to Cloudinary or fallback to Base64
 * @param {string} fileStr - base64 encoded image string or file path
 * @returns {Promise<string>} - Image URL or Base64 string
 */
const uploadImage = async (fileStr) => {
  if (!fileStr) return null;

  // If the file is already a URL (e.g. from editing an existing product), return it
  if (fileStr.startsWith('http://') || fileStr.startsWith('https://')) {
    return fileStr;
  }

  if (isConfigured) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder: 'inventory_products',
      });
      return uploadResponse.secure_url;
    } catch (error) {
      logger.error('Failed to upload to Cloudinary, falling back to original representation:', error.message);
      return fileStr;
    }
  }

  // Base64 fallback (or other representations)
  return fileStr;
};

module.exports = {
  uploadImage,
  isCloudinaryConfigured: () => !!isConfigured
};
