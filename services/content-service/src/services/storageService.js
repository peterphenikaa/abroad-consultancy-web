const path = require('path');
const { randomUUID } = require('crypto');
const { minioClient, minioExternalClient } = require('../config/minio');
const { createError } = require('../utils/appError');

const PRESIGNED_EXPIRES_SECONDS = Number(process.env.PRESIGNED_EXPIRES_SECONDS || 900);

const UPLOAD_RULES = {
  video: {
    bucket: 'videos',
    allowedExtensions: ['.mp4', '.mov', '.mkv'],
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-matroska'],
    maxBytes: 500 * 1024 * 1024, 
  },
  document: {
    bucket: 'documents',
    allowedExtensions: ['.pdf'],
    allowedMimeTypes: ['application/pdf'],
    maxBytes: 50 * 1024 * 1024, 
  },
};

function ensureBucket(bucket) {
  return minioClient.bucketExists(bucket).then((exists) => {
    if (!exists) return minioClient.makeBucket(bucket, 'us-east-1');
  });
}

function normalizeType(type) {
  if (!type) throw createError('type is required');
  const t = String(type).toLowerCase();
  if (!UPLOAD_RULES[t]) throw createError('Unsupported type. Allowed: video, document');
  return t;
}

function validateFile(rule, originalName, mimeType, fileSize) {
  if (!originalName || !mimeType || fileSize === undefined) {
    throw createError('originalName, mimeType, fileSize are required');
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!rule.allowedExtensions.includes(ext)) {
    throw createError(`Invalid extension ${ext}. Allowed: ${rule.allowedExtensions.join(', ')}`);
  }

  if (!rule.allowedMimeTypes.includes(mimeType)) {
    throw createError(`Invalid mimeType ${mimeType}`);
  }

  if (!Number.isFinite(Number(fileSize)) || Number(fileSize) <= 0) {
    throw createError('fileSize must be a positive number');
  }

  if (Number(fileSize) > rule.maxBytes) {
    throw createError(`File too large. Max ${rule.maxBytes} bytes`);
  }

  return ext;
}

function sanitizeId(value, fieldName) {
  if (!value) throw createError(`${fieldName} is required`);
  return String(value).replace(/[^a-zA-Z0-9-_]/g, '');
}

function buildObjectKey({ lessonId, ext }) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const ts = now.getTime();

  return `lessons/${lessonId}/${y}/${m}/${d}/${ts}-${randomUUID()}${ext}`;
}

const StorageService = {
  getUploadUrl: async ({ type, originalName, mimeType, fileSize, lessonId }) => {
    const normalizedType = normalizeType(type);
    const rule = UPLOAD_RULES[normalizedType];
    const safeLessonId = sanitizeId(lessonId, 'lessonId');

    const ext = validateFile(rule, originalName, mimeType, Number(fileSize));
    const objectKey = buildObjectKey({ lessonId: safeLessonId, ext });

    await ensureBucket(rule.bucket);

    const uploadUrl = await minioExternalClient.presignedPutObject(
      rule.bucket,
      objectKey,
      PRESIGNED_EXPIRES_SECONDS
    );

    return {
      uploadUrl,
      bucket: rule.bucket,
      objectKey,
      expiresIn: PRESIGNED_EXPIRES_SECONDS,
      fileConstraints: {
        allowedExtensions: rule.allowedExtensions,
        allowedMimeTypes: rule.allowedMimeTypes,
        maxBytes: rule.maxBytes,
      },
    };
  },

  verifyUploadedObject: async ({ bucket, objectKey }) => {
    if (!bucket || !objectKey) throw createError('bucket and objectKey are required');

    try {
      const stat = await minioClient.statObject(bucket, objectKey);
      return {
        exists: true,
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
      };
    } catch (error) {
      throw createError('Uploaded object not found on storage. Please upload file first.', 404);
    }
  },
};

module.exports = StorageService;