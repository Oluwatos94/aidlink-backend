import prisma from '../config/database';
import { CampaignInput, CampaignFilters, PaginatedResponse } from '../types';
import { CampaignStatus, Role } from '@prisma/client';
import { AppError } from '../middleware/error';
import logger from '../config/logger';

export class CampaignService {
  static async createCampaign(data: CampaignInput, userId: string, organizationId: string): Promise<any> {
    // Verify organization exists and belongs to user
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    if (organization.userId !== userId) {
      throw new AppError('You do not have permission to create campaigns for this organization', 403);
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        userId,
        organizationId,
        status: CampaignStatus.DRAFT,
      },
    });

    logger.info(`Campaign created: ${campaign.id} by user ${userId}`);

    return campaign;
  }

  static async getCampaigns(filters: CampaignFilters, pagination: any): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.startDate) {
      where.startDate = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.endDate = { lte: filters.endDate };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              donations: true,
              beneficiaries: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCampaignById(id: string): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            website: true,
          },
        },
        donations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        beneficiaries: {
          include: {
            beneficiary: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                country: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    return campaign;
  }

  static async updateCampaign(id: string, data: Partial<CampaignInput>, userId: string, userRole: Role): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Check permissions
    if (campaign.userId !== userId && userRole !== Role.ADMIN) {
      throw new AppError('You do not have permission to update this campaign', 403);
    }

    // Prevent updating if campaign is completed or cancelled
    if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.CANCELLED) {
      throw new AppError('Cannot update a completed or cancelled campaign', 400);
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data,
    });

    logger.info(`Campaign updated: ${id} by user ${userId}`);

    return updated;
  }

  static async deleteCampaign(id: string, userId: string, userRole: Role): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Check permissions
    if (campaign.userId !== userId && userRole !== Role.ADMIN) {
      throw new AppError('You do not have permission to delete this campaign', 403);
    }

    // Only allow deletion of draft campaigns
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new AppError('Can only delete draft campaigns', 400);
    }

    await prisma.campaign.delete({
      where: { id },
    });

    logger.info(`Campaign deleted: ${id} by user ${userId}`);
  }

  static async updateCampaignStatus(id: string, status: CampaignStatus, userId: string, userRole: Role): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Check permissions
    if (campaign.userId !== userId && userRole !== Role.ADMIN) {
      throw new AppError('You do not have permission to update this campaign status', 403);
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    logger.info(`Campaign status updated: ${id} to ${status} by user ${userId}`);

    return updated;
  }

  static async addMilestone(campaignId: string, data: any, userId: string, userRole: Role): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Check permissions
    if (campaign.userId !== userId && userRole !== Role.ADMIN) {
      throw new AppError('You do not have permission to add milestones to this campaign', 403);
    }

    const milestone = await prisma.milestone.create({
      data: {
        ...data,
        campaignId,
      },
    });

    logger.info(`Milestone added to campaign ${campaignId} by user ${userId}`);

    return milestone;
  }

  static async assignBeneficiary(campaignId: string, beneficiaryId: string, data: any, userId: string, userRole: Role): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Check permissions
    if (campaign.userId !== userId && userRole !== Role.ADMIN) {
      throw new AppError('You do not have permission to assign beneficiaries to this campaign', 403);
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new AppError('Beneficiary not found', 404);
    }

    const assignment = await prisma.beneficiaryAssignment.upsert({
      where: {
        campaignId_beneficiaryId: {
          campaignId,
          beneficiaryId,
        },
      },
      update: data,
      create: {
        campaignId,
        beneficiaryId,
        ...data,
        assignedBy: userId,
      },
    });

    logger.info(`Beneficiary ${beneficiaryId} assigned to campaign ${campaignId} by user ${userId}`);

    return assignment;
  }

  static async getCampaignStats(campaignId: string): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            donations: true,
            beneficiaries: true,
            distributions: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const totalDonated = await prisma.donation.aggregate({
      where: {
        campaignId,
        status: 'CONFIRMED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalDistributed = await prisma.distribution.aggregate({
      where: {
        campaignId,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      campaignId: campaign.id,
      title: campaign.title,
      targetAmount: campaign.targetAmount,
      currentAmount: campaign.currentAmount,
      totalDonated: totalDonated._sum.amount || 0,
      totalDistributed: totalDistributed._sum.amount || 0,
      donationCount: campaign._count.donations,
      beneficiaryCount: campaign._count.beneficiaries,
      distributionCount: campaign._count.distributions,
      progress: Number(((campaign.currentAmount || 0) / (campaign.targetAmount || 1)) * 100).toFixed(2),
    };
  }
}
