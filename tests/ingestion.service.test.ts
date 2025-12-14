import { Queue } from 'bullmq';
import { createIngestionService } from '../src/services/ingestion.service';

describe('Ingestion Service (Unit)', () => {
  let mockQueue: Queue;
  let ingestionService: ReturnType<typeof createIngestionService>;

  beforeEach(() => {
    // 1. Mock the Queue dependency
    mockQueue = {
      add: jest.fn(),
    } as unknown as Queue;

    // 2. Inject the mock into the service factory
    ingestionService = createIngestionService(mockQueue);
  });

  it('should add an ingestion job to the queue', async () => {
    const jobData = {
      fileId: 'file-uuid-123',
    };

    // 3. Call the service method
    await ingestionService.addIngestionJob(jobData);

    // 4. Verify the queue mock was called with correct arguments
    expect(mockQueue.add).toHaveBeenCalledWith('ingest', jobData);
  });
});
