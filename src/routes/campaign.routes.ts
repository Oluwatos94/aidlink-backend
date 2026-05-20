import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth';
import { campaignCreateLimiter } from '../middleware/rateLimit';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { campaignSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - targetAmount
 *               - startDate
 *               - organizationId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               organizationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.post('/', campaignCreateLimiter, validate(campaignSchema), CampaignController.createCampaign);

/**
 * @swagger
 * /api/v1/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaigns retrieved successfully
 */
router.get('/', CampaignController.getCampaigns);

/**
 * @swagger
 * /api/v1/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 */
router.get('/:id', CampaignController.getCampaignById);

/**
 * @swagger
 * /api/v1/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 */
router.put('/:id', validate(campaignSchema), CampaignController.updateCampaign);

/**
 * @swagger
 * /api/v1/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 */
router.delete('/:id', CampaignController.deleteCampaign);

/**
 * @swagger
 * /api/v1/campaigns/{id}/status:
 *   patch:
 *     summary: Update campaign status
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Campaign status updated successfully
 */
router.patch('/:id/status', CampaignController.updateCampaignStatus);

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/milestones:
 *   post:
 *     summary: Add milestone to campaign
 *     tags: [Campaigns]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - targetAmount
 *               - order
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Milestone added successfully
 */
router.post('/:campaignId/milestones', CampaignController.addMilestone);

/**
 * @swagger
 * /api/v1/campaigns/{campaignId}/beneficiaries:
 *   post:
 *     summary: Assign beneficiary to campaign
 *     tags: [Campaigns]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - beneficiaryId
 *             properties:
 *               beneficiaryId:
 *                 type: string
 *               assignedAmount:
 *                 type: number
 *               priority:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Beneficiary assigned successfully
 */
router.post('/:campaignId/beneficiaries', CampaignController.assignBeneficiary);

/**
 * @swagger
 * /api/v1/campaigns/{id}/stats:
 *   get:
 *     summary: Get campaign statistics
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign statistics retrieved successfully
 */
router.get('/:id/stats', CampaignController.getCampaignStats);

export default router;
