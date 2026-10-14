const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/** Avatar uploads are kept in memory, validated, then stored in MongoDB. */
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPG, PNG or WEBP images are allowed'));
    }
    return cb(null, true);
  },
}).single('avatar');

/**
 * Check the real file signature ("magic bytes") — the client-sent mimetype
 * can be spoofed, so we never trust it alone (Security NFR).
 */
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const handleAvatarUpload = (req, res, next) => {
  avatarUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('Image must be 2 MB or smaller'));
      }
      return next(err instanceof ApiError ? err : ApiError.badRequest(err.message));
    }
    if (!req.file) return next(ApiError.badRequest('Please choose an image to upload'));
    const realType = detectImageType(req.file.buffer);
    if (!realType) return next(ApiError.badRequest('The file is not a valid JPG, PNG or WEBP image'));
    req.file.detectedType = realType;
    return next();
  });
};

module.exports = { handleAvatarUpload, MAX_AVATAR_BYTES };
