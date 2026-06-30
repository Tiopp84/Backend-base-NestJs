import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`[NotificationsProcessor] Processing job ${job.id} of type ${job.name}`);
    console.log(`[NotificationsProcessor] Job data:`, job.data);
    
    // Giả lập delay gửi email/thông báo
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    console.log(`[NotificationsProcessor] Job ${job.id} completed!`);
  }
}
