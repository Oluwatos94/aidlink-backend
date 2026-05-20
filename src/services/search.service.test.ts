import { SearchService } from './search.service';
import prisma from '../config/database';

// Mock Prisma
jest.mock('../config/database');

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCampaigns', () => {
    it('should return search results for campaigns', async () => {
      const mockCampaigns = [
        {
          id: '1',
          title: 'Test Campaign',
          status: 'ACTIVE',
          organization: { name: 'Test Org' },
          _count: { donations: 10, beneficiaries: 5, distributions: 3 },
        },
      ];

      (prisma.campaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.campaign.count as jest.Mock).mockResolvedValue(1);

      const result = await SearchService.searchCampaigns({
        query: 'test',
        page: 1,
        limit: 20,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('searchDonations', () => {
    it('should return search results for donations', async () => {
      const mockDonations = [
        {
          id: '1',
          amount: 100,
          status: 'CONFIRMED',
          campaign: { id: '1', title: 'Test Campaign' },
        },
      ];

      (prisma.donation.findMany as jest.Mock).mockResolvedValue(mockDonations);
      (prisma.donation.count as jest.Mock).mockResolvedValue(1);

      const result = await SearchService.searchDonations({
        query: 'test',
        page: 1,
        limit: 20,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });

  describe('searchBeneficiaries', () => {
    it('should return search results for beneficiaries', async () => {
      const mockBeneficiaries = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          status: 'VERIFIED',
          user: { id: '1', email: 'test@example.com' },
          _count: { distributions: 2 },
        },
      ];

      (prisma.beneficiary.findMany as jest.Mock).mockResolvedValue(mockBeneficiaries);
      (prisma.beneficiary.count as jest.Mock).mockResolvedValue(1);

      const result = await SearchService.searchBeneficiaries({
        query: 'John',
        page: 1,
        limit: 20,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });

  describe('globalSearch', () => {
    it('should throw error if query is not provided', async () => {
      await expect(SearchService.globalSearch({ page: 1, limit: 10 })).rejects.toThrow('Query is required');
    });

    it('should return results from all entities', async () => {
      const mockCampaigns = [{ id: '1', title: 'Test', status: 'ACTIVE', entityType: 'campaign' }];
      const mockDonations = [{ id: '1', amount: 100, status: 'CONFIRMED', entityType: 'donation' }];
      const mockBeneficiaries = [{ id: '1', firstName: 'Test', lastName: 'User', status: 'VERIFIED', entityType: 'beneficiary' }];

      (prisma.campaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.donation.findMany as jest.Mock).mockResolvedValue(mockDonations);
      (prisma.beneficiary.findMany as jest.Mock).mockResolvedValue(mockBeneficiaries);

      const result = await SearchService.globalSearch({
        query: 'test',
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('data');
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
