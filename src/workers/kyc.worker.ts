import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { BeneficiaryService } from '../services/beneficiary.service';
import { KYCStatus } from '@prisma/client';
import logger from '../config/logger';

const kycWorker = new Worker(
  'kyc-queue',
  async (job: Job) => {
    const { type, data } = job.data;

    logger.info(`Processing KYC job: ${job.id}, type: ${type}`);

    try {
      switch (type) {
        case 'CALCULATE_RISK_SCORE':
          const riskScore = await BeneficiaryService.calculateRiskScore(data.beneficiaryId);
          logger.info(`Risk score calculated for beneficiary ${data.beneficiaryId}: ${riskScore}`);
          return { riskScore };

        case 'AUTO_REVIEW_KYC':
          // Automated KYC review based on risk score
          const beneficiary = await BeneficiaryService.calculateRiskScore(data.beneficiaryId);

          if (beneficiary < 30) {
            // Low risk - auto approve
            await BeneficiaryService.reviewKYC(
              data.submissionId,
              KYCStatus.APPROVED,
              'Auto-approved: Low risk profile',
              data.systemUserId,
              'ADMIN'
            );
            return { status: 'approved' };
          } else if (beneficiary > 70) {
            // High risk - auto reject
            await BeneficiaryService.reviewKYC(
              data.submissionId,
              KYCStatus.REJECTED,
              'Auto-rejected: High risk profile',
              data.systemUserId,
              'ADMIN'
            );
            return { status: 'rejected' };
          }
          // Medium risk - requires manual review
          return { status: 'manual_review_required' };

        case 'FRAUD_DETECTION':
          // Run fraud detection algorithms
          // This would integrate with external fraud detection services
          logger.info(`Running fraud detection for beneficiary ${data.beneficiaryId}`);
          return { status: 'fraud_detection_completed' };

        default:
          throw new Error(`Unknown KYC job type: ${type}`);
      }

      logger.info(`KYC job completed: ${job.id}`);
      return { status: 'completed' };
    } catch (error) {
      logger.error(`KYC job failed: ${job.id}`, error);
      throw error;
    }
  },
  {
    connection: {
      host: config.bullmq.redisHost,
      port: config.bullmq.redisPort,
      password: config.bullmq.redisPassword,
    },
    concurrency: 5,
  }
);

kycWorker.on('completed', (job) => {
  logger.info(`KYC job completed: ${job.id}`);
});

kycWorker.on('failed', (job, err) => {
  logger.error(`KYC job failed: ${job?.id}`, err);
});

export default kycWorker;
