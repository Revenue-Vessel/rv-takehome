import { analyzeDealTrends, DealTrend, TrendInsights } from '../trendDetection';
import { Deal } from '../../lib/entities/deals/Deal';

// Mock current date for consistent testing
const mockDate = new Date('2024-12-15T10:00:00Z');

// Mock the Date constructor to return our fixed date
const originalDate = global.Date;
beforeAll(() => {
  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return mockDate;
      }
      return new originalDate(...args);
    }
  } as DateConstructor;
});

afterAll(() => {
  global.Date = originalDate;
});

describe('trendDetection', () => {
  const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
    deal_id: 'deal-1',
    company_name: 'Test Company',
    sales_rep: 'John Smith',
    transportation_mode: 'road',
    stage: 'proposal',
    value: 50000,
    created_date: '2024-01-01T00:00:00Z',
    updated_date: '2024-12-01T00:00:00Z', // 14 days ago from mock date
    expected_close_date: '2024-12-31T00:00:00Z', // 16 days from mock date
    ...overrides
  });

  describe('analyzeDealTrends', () => {
    it('should calculate basic trend metrics correctly', () => {
      const deals = [
        createMockDeal({
          deal_id: 'deal-1',
          stage: 'proposal',
          value: 50000,
          updated_date: '2024-12-01T00:00:00Z', // 14 days ago from mock date
          expected_close_date: '2024-12-31T00:00:00Z' // 16 days from mock date
        })
      ];

      const result = analyzeDealTrends(deals);
      const trend = result.trends[0];

      // Calculate expected values based on mock date
      const daysInStage = Math.floor((mockDate.getTime() - new Date('2024-12-01T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilClose = Math.floor((new Date('2024-12-31T00:00:00Z').getTime() - mockDate.getTime()) / (1000 * 60 * 60 * 24));

      expect(trend.daysInStage).toBe(daysInStage);
      expect(trend.daysUntilClose).toBe(daysUntilClose);
      expect(trend.isStalling).toBe(daysInStage >= 21);
      expect(trend.stageProbability).toBe(0.30); // Proposal stage
      expect(trend.riskScore).toBeGreaterThan(0);
      expect(trend.riskLevel).toBeDefined();
      expect(trend.priority).toBeDefined();
    });

    it('should identify stalling deals (21+ days in stage)', () => {
      const deals = [
        createMockDeal({
          deal_id: 'deal-1',
          updated_date: '2024-11-20T00:00:00Z', // 25 days ago from mock date
        })
      ];

      const result = analyzeDealTrends(deals);
      const trend = result.trends[0];

      const daysInStage = Math.floor((mockDate.getTime() - new Date('2024-11-20T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24));
      expect(trend.daysInStage).toBe(daysInStage);
      expect(trend.isStalling).toBe(true);
      expect(trend.riskFactors).toContain(`Stalled for ${daysInStage} days in proposal stage`);
    });

    it('should calculate high risk for deals closing soon', () => {
      const deals = [
        createMockDeal({
          deal_id: 'deal-1',
          expected_close_date: '2024-12-18T00:00:00Z', // 3 days from mock date
        })
      ];

      const result = analyzeDealTrends(deals);
      const trend = result.trends[0];

      const daysUntilClose = Math.floor((new Date('2024-12-18T00:00:00Z').getTime() - mockDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(trend.daysUntilClose).toBe(daysUntilClose);
      expect(trend.riskFactors).toContain(`Expected to close in ${daysUntilClose} days`);
      expect(trend.recommendations).toContain('⏰ URGENT: Finalize proposal and send to customer');
    });

    it('should prioritize high-value deals with high risk as urgent', () => {
      const deals = [
        createMockDeal({
          deal_id: 'deal-1',
          value: 150000, // High value
          updated_date: '2024-11-20T00:00:00Z', // 25 days ago (stalling)
        })
      ];

      const result = analyzeDealTrends(deals);
      const trend = result.trends[0];

      expect(trend.value).toBe(150000);
      expect(trend.isStalling).toBe(true);
      expect(trend.priority).toBe('urgent');
      expect(trend.recommendations).toContain('💎 High-value deal - ensure executive involvement');
    });

    it('should filter deals by transportation mode', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', transportation_mode: 'road' }),
        createMockDeal({ deal_id: 'deal-2', transportation_mode: 'rail' }),
        createMockDeal({ deal_id: 'deal-3', transportation_mode: 'air' })
      ];

      const result = analyzeDealTrends(deals, { transportationMode: 'road' });

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].transportationMode).toBe('road');
    });

    it('should filter deals by sales rep', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', sales_rep: 'John Smith' }),
        createMockDeal({ deal_id: 'deal-2', sales_rep: 'Sarah Johnson' })
      ];

      const result = analyzeDealTrends(deals, { salesRep: 'John Smith' });

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].salesRep).toBe('John Smith');
    });

    it('should filter deals by deal size category', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', value: 5000 }), // Small
        createMockDeal({ deal_id: 'deal-2', value: 30000 }), // Medium
        createMockDeal({ deal_id: 'deal-3', value: 100000 }) // Large
      ];

      const result = analyzeDealTrends(deals, { dealSizeCategory: 'Medium' });

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].value).toBe(30000);
    });

    it('should filter deals by risk level', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', value: 5000 }), // Low risk
        createMockDeal({ 
          deal_id: 'deal-2', 
          value: 150000,
          updated_date: '2024-11-20T00:00:00Z' // Stalling, high value = high risk
        })
      ];

      const result = analyzeDealTrends(deals, { riskLevel: 'high' });

      expect(result.trends.length).toBeGreaterThan(0);
      result.trends.forEach(trend => {
        expect(['high', 'critical']).toContain(trend.riskLevel);
      });
    });

    it('should filter deals by priority', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', value: 5000 }), // Low priority
        createMockDeal({ 
          deal_id: 'deal-2', 
          value: 150000,
          updated_date: '2024-11-20T00:00:00Z' // Stalling, high value = urgent
        })
      ];

      const result = analyzeDealTrends(deals, { priority: 'urgent' });

      expect(result.trends.length).toBeGreaterThan(0);
      result.trends.forEach(trend => {
        expect(trend.priority).toBe('urgent');
      });
    });

    it('should filter deals by stalling status', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', updated_date: '2024-12-10T00:00:00Z' }), // Active
        createMockDeal({ deal_id: 'deal-2', updated_date: '2024-11-20T00:00:00Z' }) // Stalling
      ];

      const result = analyzeDealTrends(deals, { isStalling: true });

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].isStalling).toBe(true);
    });

    it('should exclude closed deals from analysis', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', stage: 'proposal' }),
        createMockDeal({ deal_id: 'deal-2', stage: 'closed_won' }),
        createMockDeal({ deal_id: 'deal-3', stage: 'closed_lost' })
      ];

      const result = analyzeDealTrends(deals);

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].currentStage).toBe('proposal');
    });

    it('should sort deals by priority and risk score', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', value: 5000 }), // Low priority
        createMockDeal({ 
          deal_id: 'deal-2', 
          value: 150000,
          updated_date: '2024-11-20T00:00:00Z' // Urgent priority
        }),
        createMockDeal({ 
          deal_id: 'deal-3', 
          value: 80000,
          updated_date: '2024-12-01T00:00:00Z' // Medium priority
        })
      ];

      const result = analyzeDealTrends(deals);

      // Should be sorted by priority (urgent first)
      expect(result.trends[0].priority).toBe('urgent');
    });

    it('should generate insights correctly', () => {
      const deals = [
        createMockDeal({ deal_id: 'deal-1', value: 5000 }), // Low risk
        createMockDeal({ 
          deal_id: 'deal-2', 
          value: 150000,
          updated_date: '2024-11-20T00:00:00Z' // High risk, stalling (25 days ago)
        }),
        createMockDeal({ 
          deal_id: 'deal-3', 
          value: 80000,
          updated_date: '2024-11-24T00:00:00Z' // Medium risk, stalling (21 days ago)
        })
      ];

      const result = analyzeDealTrends(deals);
      const insights = result.insights;

      expect(insights.totalDeals).toBe(3);
      expect(insights.stallingDeals).toBe(2);
      expect(insights.highRiskDeals).toBeGreaterThan(0);
      expect(insights.averageRiskScore).toBeGreaterThan(0);
      expect(insights.totalValueAtRisk).toBeGreaterThan(0);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty deals array', () => {
      const result = analyzeDealTrends([]);

      expect(result.trends).toHaveLength(0);
      expect(result.insights.totalDeals).toBe(0);
      expect(result.insights.stallingDeals).toBe(0);
      expect(result.insights.highRiskDeals).toBe(0);
    });

    it('should apply multiple filters correctly', () => {
      const deals = [
        createMockDeal({ 
          deal_id: 'deal-1', 
          transportation_mode: 'road',
          sales_rep: 'John Smith',
          value: 30000
        }),
        createMockDeal({ 
          deal_id: 'deal-2', 
          transportation_mode: 'rail',
          sales_rep: 'John Smith',
          value: 30000
        }),
        createMockDeal({ 
          deal_id: 'deal-3', 
          transportation_mode: 'road',
          sales_rep: 'Sarah Johnson',
          value: 30000
        })
      ];

      const result = analyzeDealTrends(deals, {
        transportationMode: 'road',
        salesRep: 'John Smith'
      });

      expect(result.trends).toHaveLength(1);
      expect(result.trends[0].transportationMode).toBe('road');
      expect(result.trends[0].salesRep).toBe('John Smith');
    });
  });

  describe('risk scoring', () => {
    it('should calculate higher risk for deals in early stages', () => {
      const prospectDeal = createMockDeal({ stage: 'prospect' });
      const proposalDeal = createMockDeal({ stage: 'proposal' });

      const prospectResult = analyzeDealTrends([prospectDeal]);
      const proposalResult = analyzeDealTrends([proposalDeal]);

      expect(prospectResult.trends[0].riskScore).toBeGreaterThan(proposalResult.trends[0].riskScore);
    });

    it('should calculate higher risk for larger deals', () => {
      const smallDeal = createMockDeal({ value: 5000 });
      const largeDeal = createMockDeal({ value: 150000 });

      const smallResult = analyzeDealTrends([smallDeal]);
      const largeResult = analyzeDealTrends([largeDeal]);

      expect(largeResult.trends[0].riskScore).toBeGreaterThan(smallResult.trends[0].riskScore);
    });
  });

  describe('recommendations', () => {
    it('should provide specific recommendations for stalling deals', () => {
      const deals = [
        createMockDeal({
          updated_date: '2024-11-20T00:00:00Z' // 25 days ago
        })
      ];

      const result = analyzeDealTrends(deals);
      const trend = result.trends[0];

      expect(trend.recommendations).toContain('🚨 IMMEDIATE: Schedule customer meeting to advance deal');
      expect(trend.recommendations).toContain('📞 Contact customer to understand blockers');
    });

    it('should provide recommendations for deals closing soon', () => {
      const deals = [
        createMockDeal({
          expected_close_date: '2024-12-18T00:00:00Z' // 3 days from now
        })
      ];

      const result = analyzeDealTrends(deals);
      const trend = result.trends[0];

      expect(trend.recommendations).toContain('⏰ URGENT: Finalize proposal and send to customer');
      expect(trend.recommendations).toContain('🤝 Schedule closing meeting with decision makers');
    });
  });
}); 