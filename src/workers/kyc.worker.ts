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

        case 'AUTO_REVIEW_KYC': {
          // calculateRiskScore() returns a number, not a beneficiary object
          const riskScore = await BeneficiaryService.calculateRiskScore(data.beneficiaryId);

          if (riskScore < 30) {
            // Low risk - auto approve
            await BeneficiaryService.reviewKYC(
              data.submissionId,
              KYCStatus.APPROVED,
              'Auto-approved: Low risk profile',
              data.systemUserId,
              'ADMIN'
            );
            logger.info(`Auto-approved submission ${data.submissionId}, riskScore: ${riskScore}`);
            return { status: 'approved', riskScore };
          } else if (riskScore > 70) {
            // High risk - auto reject
            await BeneficiaryService.reviewKYC(
              data.submissionId,
              KYCStatus.REJECTED,
              'Auto-rejected: High risk profile',
              data.systemUserId,
              'ADMIN'
            );
            logger.info(`Auto-rejected submission ${data.submissionId}, riskScore: ${riskScore}`);
            return { status: 'rejected', riskScore };
          }

          // Medium risk - requires manual review
          logger.info(`Manual review required for submission ${data.submissionId}, riskScore: ${riskScore}`);
          return { status: 'manual_review_required', riskScore };
        }

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
