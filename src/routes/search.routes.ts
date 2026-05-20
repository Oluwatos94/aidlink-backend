import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';
import { searchLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   GET /api/v1/search/campaigns
 * @desc    Search campaigns with advanced filtering
 * @access  Private
 */
router.get(
  '/campaigns',
  authenticate,
  searchLimiter,
  SearchController.searchCampaigns
);

/**
 * @route   GET /api/v1/search/donations
 * @desc    Search donations with advanced filtering
 * @access  Private
 */
router.get(
  '/donations',
  authenticate,
  searchLimiter,
  SearchController.searchDonations
);

/**
 * @route   GET /api/v1/search/beneficiaries
 * @desc    Search beneficiaries with advanced filtering
 * @access  Private
 */
router.get(
  '/beneficiaries',
  authenticate,
  searchLimiter,
  SearchController.searchBeneficiaries
);

/**
 * @route   GET /api/v1/search/global
 * @desc    Global search across all entities
 * @access  Private
 */
router.get(
  '/global',
  authenticate,
  searchLimiter,
  SearchController.globalSearch
);

/**
 * @route   GET /api/v1/search/advanced
 * @desc    Advanced search with entity type filtering
 * @access  Private
 */
router.get(
  '/advanced',
  authenticate,
  searchLimiter,
  SearchController.advancedSearch
);

export default router;
