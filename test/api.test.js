const request = require('supertest');
const app = require('../index'); // Adjust the path as necessary

describe('GET /presigned-url', () => {
  it('should return a presigned URL', async () => {
    const response = await request(app)
      .get('/presigned-url')
      .query({
        file_name: 'test.jpg',
        bucket_name: 'your-bucket-name',
        content_type: 'image/jpeg',
        expires: 60
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
  });
});
