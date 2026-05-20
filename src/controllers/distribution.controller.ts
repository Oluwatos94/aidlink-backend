import { Request, Response, NextFunction } from 'express';
import { DistributionService } from '../services/distribution.service';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error';
import logger from '../config/logger';

export class DistributionController {
  static async createDistribution(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const result = await DistributionService.createDistribution(req.body, req.user.id, req.user.role);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Distribution created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirmDistribution(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { txHash } = req.body;
      
      if (!txHash) {
        throw new AppError('Transaction hash is required', 400);
      }

      const result = await DistributionService.confirmDistribution(id, txHash, req.user.id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Distribution confirmed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDistributions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaignId = req.query.campaignId as string;
      const beneficiaryId = req.query.beneficiaryId as string;

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as string || 'desc',
      };

      const result = await DistributionService.getDistributions(campaignId, beneficiaryId, pagination);
      
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDistributionStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { status } = req.body;
      
      const result = await DistributionService.updateDistributionStatus(id, status, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Distribution status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addProofDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { proofDocumentUrl } = req.body;
      
      if (!proofDocumentUrl) {
        throw new AppError('Proof document URL is required', 400);
      }

      const result = await DistributionService.addProofDocument(id, proofDocumentUrl, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Proof document added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCampaignDistributions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaignId } = req.params;

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as string || 'desc',
      };

      const result = await DistributionService.getDistributions(campaignId, undefined, pagination);
      
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBeneficiaryDistributions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { beneficiaryId } = req.params;

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as string || 'desc',
      };

      const result = await DistributionService.getDistributions(undefined, beneficiaryId, pagination);
      
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
