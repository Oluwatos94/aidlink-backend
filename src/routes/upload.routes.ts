import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/upload/profile-picture:
 *   post:
 *     summary: Upload organization profile picture
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded and Organization.logo updated
 *       400:
 *         description: No file provided
 *       404:
 *         description: Organization not found
 *       413:
 *         description: File exceeds 5MB limit
 *       415:
 *         description: Unsupported file type
 *       422:
 *         description: Image dimensions too small or corrupt file
 */
router.post('/profile-picture', uploadSingle('file'), UploadController.uploadProfilePicture);

/**
 * @swagger
 * /api/v1/upload/kyc/{submissionId}/document:
 *   post:
 *     summary: Upload a KYC identity document or selfie
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: field
 *         schema:
 *           type: string
 *           enum: [document, selfie]
 *         description: Target field — omit or pass "document" for documentUrl, "selfie" for selfieUrl
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded and KYCSubmission updated
 *       403:
 *         description: Not the submission owner
 *       404:
 *         description: Submission not found
 */
router.post(
  '/kyc/:submissionId/document',
  uploadSingle('file'),
  UploadController.uploadKycDocument,
);

/**
 * @swagger
 * /api/v1/upload/campaign/{campaignId}/image:
 *   post:
 *     summary: Upload a campaign cover image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and Campaign.imageUrl updated
 *       403:
 *         description: Not the campaign owner
 *       422:
 *         description: Image below minimum 400×300px or corrupt
 */
router.post(
  '/campaign/:campaignId/image',
  uploadSingle('file'),
  UploadController.uploadCampaignImage,
);

/**
 * @swagger
 * /api/v1/upload/distribution/{distributionId}/proof:
 *   post:
 *     summary: Upload a distribution proof document
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: distributionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Proof uploaded and Distribution.proofDocumentUrl updated
 */
router.post(
  '/distribution/:distributionId/proof',
  uploadSingle('file'),
  UploadController.uploadDistributionProof,
);

/**
 * @swagger
 * /api/v1/upload/presigned:
 *   post:
 *     summary: Get a pre-signed URL for direct large-file upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadType
 *               - entityId
 *               - mimeType
 *             properties:
 *               uploadType:
 *                 type: string
 *                 enum: [profile-picture, kyc-document, campaign-image, distribution-proof]
 *               entityId:
 *                 type: string
 *               mimeType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pre-signed upload URL with expiry and size constraints
 */
router.post('/presigned', UploadController.getPresignedUploadUrl);

export default router;
