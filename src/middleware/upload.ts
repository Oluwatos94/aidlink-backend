import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // outer ceiling; per-type limits enforced in StorageService
    files: 1,
  },
});

export function uploadSingle(fieldName = 'file') {
  return (req: Request, res: Response, next: NextFunction): void => {
    multerInstance.single(fieldName)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ success: false, error: 'File too large' });
          return;
        }
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  };
}
