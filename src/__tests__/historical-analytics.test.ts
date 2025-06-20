import { calculateHistoricalAnalysis, DEAL_SIZE_CATEGORIES } from '../lib/business/deals/historical-analytics';
import { Deal } from '../lib/entities/deals/Deal';

// Mock data for testing
const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 1,
  deal_id: 'DEAL-001',
  company_name: 'Test Company',
  contact_name: 'John Doe',
  transportation_mode: 'trucking',
  stage: 'closed_won',
  value: 50000,
  probability: 100,
  created_date: '2024-01-01',
  updated_date: '2024-01-15',
  expected_close_date: '2024-01-15',
  sales_rep: 'Alice Johnson',
  origin_city: 'New York',
  destination_city: 'Los Angeles',
  cargo_type: 'electronics',
  ...overrides,
});

describe('Historical Analytics', () => {
  describe('calculateHistoricalAnalysis', () => {
    it('should calculate overall win rate correctly', () => {
      const deals = [
        createMockDeal({ stage: 'closed_won', value: 50000 }),
        createMockDeal({ stage: 'closed_won', value: 30000 }),
        createMockDeal({ stage: 'closed_lost', value: 20000 }),
        createMockDeal({ stage: 'prospect', value: 40000 }), // Should be excluded
      ];

      const result = calculateHistoricalAnalysis(deals);

      expect(result.overall.totalDeals).toBe(3);
      expect(result.overall.wonDeals).toBe(2);
      expect(result.overall.lostDeals).toBe(1);
      expect(result.overall.winRate).toBe(66.67);
      expect(result.overall.totalValue).toBe(100000);
      expect(result.overall.wonValue).toBe(80000);
      expect(result.overall.lostValue).toBe(20000);
    });

    it('should calculate win rates by transportation mode', () => {
      const deals = [
        createMockDeal({ transportation_mode: 'trucking', stage: 'closed_won', value: 50000 }),
        createMockDeal({ transportation_mode: 'trucking', stage: 'closed_lost', value: 30000 }),
        createMockDeal({ transportation_mode: 'rail', stage: 'closed_won', value: 40000 }),
        createMockDeal({ transportation_mode: 'rail', stage: 'closed_won', value: 60000 }),
      ];

      const result = calculateHistoricalAnalysis(deals);

      expect(result.byTransportationMode.trucking.winRate).toBe(50);
      expect(result.byTransportationMode.rail.winRate).toBe(100);
      expect(result.byTransportationMode.trucking.totalDeals).toBe(2);
      expect(result.byTransportationMode.rail.totalDeals).toBe(2);
    });

    it('should calculate win rates by sales rep', () => {
      const deals = [
        createMockDeal({ sales_rep: 'Alice', stage: 'closed_won', value: 50000 }),
        createMockDeal({ sales_rep: 'Alice', stage: 'closed_won', value: 30000 }),
        createMockDeal({ sales_rep: 'Bob', stage: 'closed_lost', value: 20000 }),
        createMockDeal({ sales_rep: 'Bob', stage: 'closed_won', value: 40000 }),
      ];

      const result = calculateHistoricalAnalysis(deals);

      expect(result.bySalesRep.Alice.winRate).toBe(100);
      expect(result.bySalesRep.Bob.winRate).toBe(50);
      expect(result.bySalesRep.Alice.totalDeals).toBe(2);
      expect(result.bySalesRep.Bob.totalDeals).toBe(2);
    });

    it('should calculate win rates by deal size', () => {
      const deals = [
        createMockDeal({ value: 5000, stage: 'closed_won' }), // Small
        createMockDeal({ value: 5000, stage: 'closed_lost' }), // Small
        createMockDeal({ value: 30000, stage: 'closed_won' }), // Medium
        createMockDeal({ value: 100000, stage: 'closed_won' }), // Large
        createMockDeal({ value: 300000, stage: 'closed_lost' }), // Enterprise
      ];

      const result = calculateHistoricalAnalysis(deals);

      expect(result.byDealSize.Small.winRate).toBe(50);
      expect(result.byDealSize.Medium.winRate).toBe(100);
      expect(result.byDealSize.Large.winRate).toBe(100);
      expect(result.byDealSize.Enterprise.winRate).toBe(0);
    });

    it('should filter deals by transportation mode', () => {
      const deals = [
        createMockDeal({ transportation_mode: 'trucking', stage: 'closed_won', value: 50000 }),
        createMockDeal({ transportation_mode: 'rail', stage: 'closed_won', value: 30000 }),
        createMockDeal({ transportation_mode: 'ocean', stage: 'closed_lost', value: 20000 }),
      ];

      const result = calculateHistoricalAnalysis(deals, { transportationMode: 'trucking' });

      expect(result.overall.totalDeals).toBe(1);
      expect(result.overall.winRate).toBe(100);
      expect(result.byTransportationMode.trucking).toBeDefined();
      expect(result.byTransportationMode.rail).toBeUndefined();
    });

    it('should filter deals by sales rep', () => {
      const deals = [
        createMockDeal({ sales_rep: 'Alice', stage: 'closed_won', value: 50000 }),
        createMockDeal({ sales_rep: 'Bob', stage: 'closed_lost', value: 30000 }),
      ];

      const result = calculateHistoricalAnalysis(deals, { salesRep: 'Alice' });

      expect(result.overall.totalDeals).toBe(1);
      expect(result.overall.winRate).toBe(100);
    });

    it('should filter deals by deal size category', () => {
      const deals = [
        createMockDeal({ value: 5000, stage: 'closed_won' }), // Small
        createMockDeal({ value: 30000, stage: 'closed_won' }), // Medium
        createMockDeal({ value: 100000, stage: 'closed_lost' }), // Large
        createMockDeal({ value: 300000, stage: 'closed_won' }), // Enterprise
      ];

      const result = calculateHistoricalAnalysis(deals, { dealSizeCategory: 'Small' });

      expect(result.overall.totalDeals).toBe(1);
      expect(result.overall.winRate).toBe(100);
      expect(result.overall.totalValue).toBe(5000);
    });

    it('should filter deals by date range', () => {
      const deals = [
        createMockDeal({ expected_close_date: '2024-01-15', stage: 'closed_won', value: 50000 }),
        createMockDeal({ expected_close_date: '2024-02-15', stage: 'closed_won', value: 30000 }),
        createMockDeal({ expected_close_date: '2024-03-15', stage: 'closed_lost', value: 20000 }),
      ];

      const result = calculateHistoricalAnalysis(deals, { 
        startDate: '2024-02-01', 
        endDate: '2024-02-29' 
      });

      expect(result.overall.totalDeals).toBe(1);
      expect(result.overall.winRate).toBe(100);
    });

    it('should generate insights for performance gaps', () => {
      const deals = [
        // Small deals - high win rate
        createMockDeal({ value: 5000, stage: 'closed_won' }),
        createMockDeal({ value: 5000, stage: 'closed_won' }),
        createMockDeal({ value: 5000, stage: 'closed_lost' }),
        // Enterprise deals - low win rate
        createMockDeal({ value: 300000, stage: 'closed_lost' }),
        createMockDeal({ value: 300000, stage: 'closed_lost' }),
        createMockDeal({ value: 300000, stage: 'closed_won' }),
      ];

      const result = calculateHistoricalAnalysis(deals);

      expect(result.insights).toContainEqual(
        expect.stringContaining('Team excels at small deals but struggles with enterprise deals')
      );
    });

    it('should handle empty deals array', () => {
      const result = calculateHistoricalAnalysis([]);

      expect(result.overall.totalDeals).toBe(0);
      expect(result.overall.winRate).toBe(0);
      expect(result.overall.totalValue).toBe(0);
      // Empty deals array will still generate insights about low win rate
      expect(result.insights).toContainEqual(
        expect.stringContaining('Overall win rate is below 50%')
      );
    });

    it('should handle deals with no closed deals', () => {
      const deals = [
        createMockDeal({ stage: 'prospect', value: 50000 }),
        createMockDeal({ stage: 'qualified', value: 30000 }),
        createMockDeal({ stage: 'proposal', value: 20000 }),
      ];

      const result = calculateHistoricalAnalysis(deals);

      expect(result.overall.totalDeals).toBe(0);
      expect(result.overall.winRate).toBe(0);
      // No closed deals will still generate insights about low win rate
      expect(result.insights).toContainEqual(
        expect.stringContaining('Overall win rate is below 50%')
      );
    });
  });

  describe('DEAL_SIZE_CATEGORIES', () => {
    it('should have correct category definitions', () => {
      expect(DEAL_SIZE_CATEGORIES).toHaveLength(4);
      
      const small = DEAL_SIZE_CATEGORIES.find(cat => cat.category === 'Small');
      expect(small).toEqual({ category: 'Small', minValue: 0, maxValue: 10000 });
      
      const medium = DEAL_SIZE_CATEGORIES.find(cat => cat.category === 'Medium');
      expect(medium).toEqual({ category: 'Medium', minValue: 10001, maxValue: 50000 });
      
      const large = DEAL_SIZE_CATEGORIES.find(cat => cat.category === 'Large');
      expect(large).toEqual({ category: 'Large', minValue: 50001, maxValue: 200000 });
      
      const enterprise = DEAL_SIZE_CATEGORIES.find(cat => cat.category === 'Enterprise');
      expect(enterprise).toEqual({ category: 'Enterprise', minValue: 200001, maxValue: Infinity });
    });
  });
}); 