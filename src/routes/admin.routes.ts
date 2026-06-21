import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { ModerationController } from '../controllers/moderation.controller';
import { OrganizationController } from '../controllers/organization.controller';
import { MilestoneController } from '../controllers/milestone.controller';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import {
  suspendCampaignSchema,
  reinstateCampaignSchema,
  resolveAppealSchema,
  organizationReviewSchema,
  organizationRejectSchema,
  milestoneReviewSchema,
} from '../utils/validation';

const router = Router();

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'REJECTED', 'DELETED']),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'ORGANIZATION', 'DONOR', 'BENEFICIARY', 'VERIFIER', 'AUDITOR']),
});

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get(
  '/dashboard',
  authenticate,
  AdminController.getDashboardStats
);

/**
 * @route   GET /api/v1/admin/activity
 * @desc    Get recent activity across the platform
 * @access  Private (Admin)
 */
router.get(
  '/activity',
  authenticate,
  AdminController.getRecentActivity
);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin)
 */
router.get(
  '/users',
  authenticate,
  AdminController.getAllUsers
);

/**
 * @route   PATCH /api/v1/admin/users/:id/status
 * @desc    Update user status
 * @access  Private (Admin)
 */
router.patch(
  '/users/:id/status',
  authenticate,
  validate(updateStatusSchema),
  AdminController.updateUserStatus
);

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.patch(
  '/users/:id/role',
  authenticate,
  validate(updateRoleSchema),
  AdminController.updateUserRole
);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Admin)
 */
router.get(
  '/audit-logs',
  authenticate,
  AdminController.getAuditLogs
);

/**
 * @route   GET /api/v1/admin/health
 * @desc    Get system health status
 * @access  Private (Admin)
 */
router.get(
  '/health',
  authenticate,
  AdminController.getSystemHealth
);

// ─── Campaign moderation (Admin) ───────────────────────────────

/**
 * @route   POST /api/v1/admin/campaigns/:id/suspend
 * @desc    Suspend a campaign with a recorded reason
 * @access  Private (Admin)
 */
router.post(
  '/campaigns/:id/suspend',
  authenticate,
  validate(suspendCampaignSchema),
  ModerationController.suspendCampaign
);

/**
 * @route   POST /api/v1/admin/campaigns/:id/reinstate
 * @desc    Reinstate a suspended campaign
 * @access  Private (Admin)
 */
router.post(
  '/campaigns/:id/reinstate',
  authenticate,
  validate(reinstateCampaignSchema),
  ModerationController.reinstateCampaign
);

/**
 * @route   GET /api/v1/admin/campaigns/:id/suspensions
 * @desc    List suspensions (with appeals) for a campaign
 * @access  Private (Admin)
 */
router.get(
  '/campaigns/:id/suspensions',
  authenticate,
  ModerationController.getSuspensions
);

/**
 * @route   GET /api/v1/admin/appeals
 * @desc    List and filter appeals across campaigns
 * @access  Private (Admin)
 */
router.get(
  '/appeals',
  authenticate,
  ModerationController.listAppeals
);

/**
 * @route   POST /api/v1/admin/appeals/:id/resolve
 * @desc    Approve or deny an appeal
 * @access  Private (Admin)
 */
router.post(
  '/appeals/:id/resolve',
  authenticate,
  validate(resolveAppealSchema),
  ModerationController.resolveAppeal
);

// ─── Organization verification (Admin) ──────────────────────────

router.post(
  '/organizations/:id/verification/approve',
  authenticate,
  validate(organizationReviewSchema),
  OrganizationController.approveVerification
);

router.post(
  '/organizations/:id/verification/reject',
  authenticate,
  validate(organizationRejectSchema),
  OrganizationController.rejectVerification
);

router.post(
  '/organizations/:id/verification/request-more-info',
  authenticate,
  validate(organizationRejectSchema),
  OrganizationController.requestMoreInfo
);

// ─── Milestone verification (Admin / Verifier) ─────────────────

/**
 * @route   GET /api/v1/admin/milestone-submissions
 * @desc    List submissions awaiting review (filterable)
 * @access  Private (Admin, Verifier)
 */
router.get(
  '/milestone-submissions',
  authenticate,
  authorize('ADMIN', 'VERIFIER'),
  MilestoneController.listAdminSubmissions
);

/**
 * @route   GET /api/v1/admin/milestone-submissions/:submissionId
 * @desc    Get full submission details + reviews + history
 * @access  Private (Admin, Verifier)
 */
router.get(
  '/milestone-submissions/:submissionId',
  authenticate,
  authorize('ADMIN', 'VERIFIER'),
  MilestoneController.getAdminSubmission
);

/**
 * @route   POST /api/v1/admin/milestone-submissions/:submissionId/reviews
 * @desc    Submit a review decision for a submission
 * @access  Private (Admin, Verifier)
 */
router.post(
  '/milestone-submissions/:submissionId/reviews',
  authenticate,
  authorize('ADMIN', 'VERIFIER'),
  validate(milestoneReviewSchema),
  MilestoneController.createReview
);

/**
 * @route   GET /api/v1/admin/milestone-submissions/:submissionId/reviews
 * @desc    List all reviews for a submission
 * @access  Private (Admin, Verifier)
 */
router.get(
  '/milestone-submissions/:submissionId/reviews',
  authenticate,
  authorize('ADMIN', 'VERIFIER'),
  MilestoneController.listSubmissionReviews
);

/**
 * @route   GET /api/v1/admin/milestones/:milestoneId/verification-status
 * @desc    Get current verification status, history, and metrics
 * @access  Private (Admin, Verifier)
 */
router.get(
  '/milestones/:milestoneId/verification-status',
  authenticate,
  authorize('ADMIN', 'VERIFIER'),
  MilestoneController.getMilestoneVerificationStatus
);

export default router;
