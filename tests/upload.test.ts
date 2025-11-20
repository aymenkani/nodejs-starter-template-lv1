import supertest from 'supertest';
import { app } from '../src/server'; // Import app directly

describe('Upload API', () => {
  // Server setup and teardown are handled globally by globalSetup.ts and globalTeardown.ts

  describe('POST /api/upload/generate-signed-url', () => {
    it('should return a signed URL', async () => {
      const res = await supertest(app)
        .post('/api/v1/upload/generate-signed-url')
        .send({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024,
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('signedUrl');
    });
  });
});
