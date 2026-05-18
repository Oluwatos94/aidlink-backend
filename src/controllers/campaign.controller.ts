import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaign.service';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error';

export class CampaignController {
  static async createCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { organizationId } = req.body;
      const campaign = await CampaignService.createCampaign(req.body, req.user.id, organizationId);
      
      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        organizationId: req.query.organizationId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await CampaignService.getCampaigns(filters, pagination);
      
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCampaignById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await CampaignService.getCampaignById(id);
      
      res.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const campaign = await CampaignService.updateCampaign(id, req.body, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campaign updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      await CampaignService.deleteCampaign(id, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCampaignStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { status } = req.body;
      const campaign = await CampaignService.updateCampaignStatus(id, status, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campaign status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMilestone(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { campaignId } = req.params;
      const milestone = await CampaignService.addMilestone(campaignId, req.body, req.user.id, req.user.role);
      
      res.status(201).json({
        success: true,
        data: milestone,
        message: 'Milestone added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignBeneficiary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { campaignId } = req.params;
      const { beneficiaryId, ...data } = req.body;
      const assignment = await CampaignService.assignBeneficiary(campaignId, beneficiaryId, data, req.user.id, req.user.role);
      
      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Beneficiary assigned successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCampaignStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await CampaignService.getCampaignStats(id);
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
