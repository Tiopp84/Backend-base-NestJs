import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    this.logger.debug(`Job data: ${JSON.stringify(job.data)}`);
    
    // Giả lập delay gửi email/thông báo
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    this.logger.log(`Job ${job.id} completed!`);
  }
}
