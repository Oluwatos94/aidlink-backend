import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { NotificationService } from '../services/notification.service';
import logger from '../config/logger';

const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { type, data } = job.data;

    logger.info(`Processing email job: ${job.id}, type: ${type}`);

    try {
      switch (type) {
        case 'DONATION_RECEIVED':
          await NotificationService.sendDonationReceivedNotification(
            data.userId,
            data.campaignTitle,
            data.amount
          );
          break;

        case 'CAMPAIGN_UPDATE':
          await NotificationService.sendCampaignUpdateNotification(
            data.userId,
            data.campaignTitle,
            data.update
          );
          break;

        case 'DISTRIBUTION_SENT':
          await NotificationService.sendDistributionSentNotification(
            data.userId,
            data.amount
          );
          break;

        case 'KYC_APPROVED':
          await NotificationService.sendKYCApprovedNotification(data.userId);
          break;

        case 'KYC_REJECTED':
          await NotificationService.sendKYCRejectedNotification(
            data.userId,
            data.reason
          );
          break;

        default:
          throw new Error(`Unknown email job type: ${type}`);
      }

      logger.info(`Email job completed: ${job.id}`);
    } catch (error) {
      logger.error(`Email job failed: ${job.id}`, error);
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

emailWorker.on('completed', (job) => {
  logger.info(`Email job completed: ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job failed: ${job?.id}`, err);
});

export default emailWorker;
