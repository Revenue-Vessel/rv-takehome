jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, { status }: any = {}) => ({
      status: status || 200,
      json: async () => data,
    }),
  },
}));

import { PUT } from '../../app/api/sales-reps/update-territories/route';

// Mock TypeORM
jest.mock('typeorm', () => ({
  getRepository: jest.fn(() => ({
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          whereInIds: jest.fn(() => ({
            execute: jest.fn()
          }))
        }))
      }))
    })),
    findByIds: jest.fn()
  }))
}));

describe('/api/sales-reps/update-territories', () => {
  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          whereInIds: jest.fn(() => ({
            execute: jest.fn()
          }))
        }))
      }))
    })),
    findByIds: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { getRepository } = require('typeorm');
    getRepository.mockReturnValue(mockRepository);
  });

  describe('PUT', () => {
    it('should update territories successfully', async () => {
      const mockUpdatedSalesReps = [
        { id: 1, first_name: 'Mike', last_name: 'Rodriguez', territory: 'CA' },
        { id: 2, first_name: 'Jennifer', last_name: 'Walsh', territory: 'CA' }
      ];

      mockRepository.findByIds.mockResolvedValue(mockUpdatedSalesReps);

      const requestBody = {
        salesRepIds: [1, 2],
        newTerritory: 'CA'
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Successfully updated 2 sales representatives to territory CA');
      expect(data.updatedSalesReps).toEqual(mockUpdatedSalesReps);
    });

    it('should return 400 when salesRepIds is missing', async () => {
      const requestBody = {
        newTerritory: 'CA'
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('salesRepIds is required');
    });

    it('should return 400 when salesRepIds is empty array', async () => {
      const requestBody = {
        salesRepIds: [],
        newTerritory: 'CA'
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('salesRepIds is required');
    });

    it('should return 400 when newTerritory is missing', async () => {
      const requestBody = {
        salesRepIds: [1, 2]
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newTerritory is required');
    });

    it('should return 400 when newTerritory is invalid', async () => {
      const requestBody = {
        salesRepIds: [1, 2],
        newTerritory: 'INVALID'
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newTerritory must be one of: CA, NY, TX, FL');
    });

    it('should return 500 when database operation fails', async () => {
      mockRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database error');
      });

      const requestBody = {
        salesRepIds: [1, 2],
        newTerritory: 'CA'
      };

      const request = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
}); 