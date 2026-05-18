import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { sorobanIndexer } from '../blockchain/soroban.indexer';
import { TransactionType } from '@prisma/client';
import logger from '../config/logger';

const blockchainWorker = new Worker(
  'blockchain-queue',
  async (job: Job) => {
    const { type, data } = job.data;

    logger.info(`Processing blockchain job: ${job.id}, type: ${type}`);

    try {
      switch (type) {
        case 'INDEX_TRANSACTION':
          await sorobanIndexer.indexTransaction(
            data.txHash,
            data.transactionType as TransactionType,
            data.metadata
          );
          break;

        case 'INDEX_EVENT':
          await sorobanIndexer.indexEvent(
            data.txHash,
            data.contractAddress,
            data.eventName,
            data.parameters
          );
          break;

        case 'PROCESS_EVENTS':
          const events = await sorobanIndexer.getUnprocessedEvents();
          for (const event of events) {
            await sorobanIndexer.markEventProcessed(event.id);
          }
          break;

        default:
          throw new Error(`Unknown blockchain job type: ${type}`);
      }

      logger.info(`Blockchain job completed: ${job.id}`);
    } catch (error) {
      logger.error(`Blockchain job failed: ${job.id}`, error);
      throw error;
    }
  },
  {
    connection: {
      host: config.bullmq.redisHost,
      port: config.bullmq.redisPort,
      password: config.bullmq.redisPassword,
    },
    concurrency: 3,
  }
);

blockchainWorker.on('completed', (job) => {
  logger.info(`Blockchain job completed: ${job.id}`);
});

blockchainWorker.on('failed', (job, err) => {
  logger.error(`Blockchain job failed: ${job?.id}`, err);
});

export default blockchainWorker;
