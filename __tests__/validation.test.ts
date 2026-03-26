import { registerSchema, createPortalSchema, spatialSearchSchema } from '@/lib/validation';

describe('Validation schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid input', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should allow missing displayName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createPortalSchema', () => {
    it('should accept valid portal', () => {
      const result = createPortalSchema.safeParse({
        name: 'Test Portal',
        latitude: 40.7128,
        longitude: -74.006,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = createPortalSchema.safeParse({
        latitude: 40.7128,
        longitude: -74.006,
      });
      expect(result.success).toBe(false);
    });

    it('should reject out-of-range latitude', () => {
      const result = createPortalSchema.safeParse({
        name: 'Test',
        latitude: 91,
        longitude: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject out-of-range longitude', () => {
      const result = createPortalSchema.safeParse({
        name: 'Test',
        latitude: 0,
        longitude: 181,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('spatialSearchSchema', () => {
    it('should coerce string params from query string', () => {
      const result = spatialSearchSchema.safeParse({
        latitude: '40.7128',
        longitude: '-74.006',
        radius_meters: '5000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(40.7128);
        expect(result.data.radius_meters).toBe(5000);
      }
    });

    it('should apply defaults', () => {
      const result = spatialSearchSchema.safeParse({
        latitude: 40,
        longitude: -74,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius_meters).toBe(2000);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject radius over 50km', () => {
      const result = spatialSearchSchema.safeParse({
        latitude: 40,
        longitude: -74,
        radius_meters: 100000,
      });
      expect(result.success).toBe(false);
    });
  });
});
