/**
 * Integration tests for API routes
 * Run with: npm test
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('API Routes', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  describe('GET /api/images', () => {
    it('should return images list', async () => {
      const response = await fetch(`${baseUrl}/api/images?limit=10`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await fetch(`${baseUrl}/api/images?limit=5&offset=0`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/images/[id]', () => {
    it('should return image by ID', async () => {
      const response = await fetch(`${baseUrl}/api/images/1`);
      const data = await response.json();
      
      // May return 404 if image doesn't exist, which is valid
      expect([200, 404]).toContain(response.status);
    });

    it('should return 400 for invalid ID', async () => {
      const response = await fetch(`${baseUrl}/api/images/invalid`);
      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make many requests quickly
      const requests = Array.from({ length: 110 }, () => 
        fetch(`${baseUrl}/api/images`)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      // At least one should be rate limited
      expect(rateLimited).toBe(true);
    });
  });
});
