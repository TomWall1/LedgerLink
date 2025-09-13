import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// Ensure upload directory exists
const uploadDir = config.upload.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on file type and user
    const userId = req.user?.id || 'anonymous';
    const fileType = file.fieldname;
    const destPath = path.join(uploadDir, userId, fileType);
    
    // Ensure directory exists
    fs.mkdirSync(destPath, { recursive: true });
    
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    
    // Sanitize filename
    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, 50);
    
    const filename = `${sanitizedBaseName}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type based on field name
  const allowedTypes: Record<string, string[]> = {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    csv: ['text/csv', 'application/csv', 'text/plain'],
    file: ['text/csv', 'application/csv', 'text/plain'], // Generic file upload
    file1: ['text/csv', 'application/csv', 'text/plain'],
    file2: ['text/csv', 'application/csv', 'text/plain'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  };
  
  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes.file;
  
  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new AppError(
      `Invalid file type. Allowed types for ${file.fieldname}: ${fieldAllowedTypes.join(', ')}`,
      400,
      true,
      'INVALID_FILE_TYPE',
      {
        fieldname: file.fieldname,
        mimetype: file.mimetype,
        allowedTypes: fieldAllowedTypes,
      }
    );
    cb(error);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // Max file size from config
    files: 10, // Max number of files
    fields: 20, // Max number of non-file fields
  },
});

// Memory storage for temporary processing
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5,
  },
});

// File cleanup utility
export const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`Deleted file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error);
  }
};

// Cleanup old files (run periodically)
export const cleanupOldFiles = (maxAgeHours: number = 24): void => {
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  const now = Date.now();
  
  const cleanupDirectory = (dir: string) => {
    try {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          cleanupDirectory(itemPath); // Recursive cleanup
          
          // Remove empty directories
          try {
            fs.rmdirSync(itemPath);
          } catch {
            // Directory not empty, ignore
          }
        } else if (stats.isFile()) {
          const fileAge = now - stats.mtime.getTime();
          
          if (fileAge > maxAge) {
            cleanupFile(itemPath);
          }
        }
      }
    } catch (error) {
      logger.error(`Error cleaning up directory ${dir}:`, error);
    }
  };
  
  logger.info(`Starting cleanup of files older than ${maxAgeHours} hours`);
  cleanupDirectory(uploadDir);
};

// File validation utilities
export const validateCSVFile = (file: Express.Multer.File): void => {
  if (!file) {
    throw new AppError('No file provided', 400, true, 'NO_FILE');
  }
  
  if (!file.mimetype.includes('csv') && !file.mimetype.includes('text')) {
    throw new AppError('File must be a CSV file', 400, true, 'INVALID_CSV_TYPE');
  }
  
  if (file.size === 0) {
    throw new AppError('File is empty', 400, true, 'EMPTY_FILE');
  }
};

export const validateImageFile = (file: Express.Multer.File): void => {
  if (!file) {
    throw new AppError('No image file provided', 400, true, 'NO_IMAGE');
  }
  
  if (!file.mimetype.startsWith('image/')) {
    throw new AppError('File must be an image', 400, true, 'INVALID_IMAGE_TYPE');
  }
  
  // Check image dimensions if needed (would require image processing library)
  const maxSize = 5 * 1024 * 1024; // 5MB for images
  if (file.size > maxSize) {
    throw new AppError('Image file too large (max 5MB)', 400, true, 'IMAGE_TOO_LARGE');
  }
};

// File URL generator
export const generateFileUrl = (req: any, filePath: string): string => {
  const relativePath = path.relative(uploadDir, filePath);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// Schedule cleanup job (run every hour)
if (!config.server.isTest) {
  setInterval(() => {
    cleanupOldFiles(24); // Clean files older than 24 hours
  }, 60 * 60 * 1000); // Run every hour
}

export default upload;