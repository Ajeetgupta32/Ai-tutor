import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/appError.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.txt' || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF (.pdf) and plain text (.txt) files are allowed!', 400));
    }
  },
});
