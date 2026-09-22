import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { upload } from '../shared/multer.shared';

const router = Router();

// Upload Single File
router.post('/upload', upload.single('file'), FileController.uploadSingle);

// Upload Multiple Files (max 10)
router.post('/upload-multiple', upload.array('files', 10), FileController.uploadMultiple);

// List All Files
router.get('/', FileController.listFiles);

// Preview/View File Inline
router.get('/view/:filename', FileController.viewFile);

// Download File Attachment
router.get('/download/:filename', FileController.downloadFile);

// Get File By ID
router.get('/:id', FileController.getFileById);

// Delete File By ID
router.delete('/:id', FileController.deleteFile);

// Rename File By ID
router.patch('/:id/rename', FileController.renameFile);
router.put('/:id/rename', FileController.renameFile);

export default router;
