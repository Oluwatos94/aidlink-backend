import { AnalyticsService } from './analytics.service';
import prisma from '../config/database';

// Mock Prisma
jest.mock('../config/database');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics', async () => {
      const mockCampaign = {
        id: '1',
        title: 'Test Campaign',
        targetAmount: 1000,
        currentAmount: 500,
        status: 'ACTIVE',
        _count: {
          donations: 10,
          beneficiaries: 5,
          distributions: 3,
        },
        donations: [
          { amount: 100, createdAt: new Date() },
          { amount: 50, createdAt: new Date() },
        ],
        distributions: [
          { amount: 25, status: 'COMPLETED', createdAt: new Date() },
        ],
      };

      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await AnalyticsService.getCampaignAnalytics('1');

      expect(result).toHaveProperty('campaign');
      expect(result).toHaveProperty('donations');
      expect(result).toHaveProperty('distributions');
      expect(result).toHaveProperty('beneficiaries');
    });

    it('should throw error if campaign not found', async () => {
      (prisma.campaign.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AnalyticsService.getCampaignAnalytics('1')).rejects.toThrow('Campaign not found');
    });
  });

  describe('getDonorAnalytics', () => {
    it('should return donor analytics', async () => {
      const mockDonations = [
        { amount: 100, campaignId: '1', campaign: { id: '1', title: 'Campaign 1' } },
        { amount: 50, campaignId: '2', campaign: { id: '2', title: 'Campaign 2' } },
      ];

      (prisma.donation.findMany as jest.Mock).mockResolvedValue(mockDonations);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await AnalyticsService.getDonorAnalytics('user1');

      expect(result).toHaveProperty('totalDonated');
      expect(result).toHaveProperty('totalDonations');
      expect(result).toHaveProperty('campaignsSupported');
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should return platform analytics', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(100);
      (prisma.campaign.count as jest.Mock).mockResolvedValue(20);
      (prisma.donation.count as jest.Mock).mockResolvedValue(500);
      (prisma.distribution.count as jest.Mock).mockResolvedValue(300);
      (prisma.beneficiary.count as jest.Mock).mockResolvedValue(50);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.donation.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 10000 } });

      const result = await AnalyticsService.getPlatformAnalytics();

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('financials');
      expect(result).toHaveProperty('recent');
    });
  });
});
