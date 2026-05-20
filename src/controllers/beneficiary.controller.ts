import { Request, Response, NextFunction } from 'express';
import { BeneficiaryService } from '../services/beneficiary.service';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error';
import logger from '../config/logger';

export class BeneficiaryController {
  static async createBeneficiary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const result = await BeneficiaryService.createBeneficiary(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Beneficiary profile created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBeneficiaries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        country: req.query.country as string,
        city: req.query.city as string,
        riskScore: req.query.riskScore ? parseInt(req.query.riskScore as string) : undefined,
        search: req.query.search as string,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as string || 'desc',
      };

      const result = await BeneficiaryService.getBeneficiaries(filters, pagination);
      
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBeneficiaryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await BeneficiaryService.getBeneficiaryById(id);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBeneficiary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const result = await BeneficiaryService.updateBeneficiary(id, req.body, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Beneficiary updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBeneficiaryStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const { status } = req.body;
      
      const result = await BeneficiaryService.updateBeneficiaryStatus(id, status, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Beneficiary status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async calculateRiskScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const riskScore = await BeneficiaryService.calculateRiskScore(id);
      
      res.status(200).json({
        success: true,
        data: { riskScore },
        message: 'Risk score calculated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitKYC(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;
      const result = await BeneficiaryService.submitKYC(id, req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'KYC submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewKYC(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { submissionId } = req.params;
      const { status, reviewNotes } = req.body;
      
      const result = await BeneficiaryService.reviewKYC(submissionId, status, reviewNotes, req.user.id, req.user.role);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'KYC reviewed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBeneficiaryProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const beneficiary = await BeneficiaryService.getBeneficiaryByUserId(req.user.id);
      
      res.status(200).json({
        success: true,
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }
}
