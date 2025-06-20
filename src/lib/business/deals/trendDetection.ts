import { Deal } from "../../entities/deals/Deal";

export interface DealTrend {
  dealId: string;
  companyName: string;
  salesRep: string;
  transportationMode: string;
  currentStage: string;
  value: number;
  daysInStage: number;
  lastActivityDate: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  stageProbability: number;
  expectedCloseDate: string;
  daysUntilClose: number;
  isStalling: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface TrendInsights {
  totalDeals: number;
  stallingDeals: number;
  highRiskDeals: number;
  averageRiskScore: number;
  dealsByRiskLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  dealsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  totalValueAtRisk: number;
  recommendations: string[];
}

export interface TrendFilters {
  transportationMode?: string;
  salesRep?: string;
  dealSizeCategory?: string;
  riskLevel?: string;
  priority?: string;
  isStalling?: boolean;
}

// Stage probability weights (same as forecasting)
const STAGE_PROBABILITIES: Record<string, number> = {
  'prospect': 0.05,
  'qualified': 0.15,
  'proposal': 0.30,
  'negotiation': 0.60,
  'closed_won': 1.0,
  'closed_lost': 0.0,
};

// Risk factors and their weights
const RISK_FACTORS = {
  DAYS_IN_STAGE: {
    weights: {
      'prospect': { low: 0, medium: 14, high: 30, critical: 45 },
      'qualified': { low: 0, medium: 21, high: 35, critical: 50 },
      'proposal': { low: 0, medium: 14, high: 25, critical: 35 },
      'negotiation': { low: 0, medium: 7, high: 14, critical: 21 },
    },
    maxScore: 40
  },
  DAYS_UNTIL_CLOSE: {
    weights: { low: 0, medium: 30, high: 60, critical: 90 },
    maxScore: 30
  },
  DEAL_SIZE: {
    weights: { low: 10000, medium: 50000, high: 100000, critical: 200000 },
    maxScore: 20
  },
  STAGE_PROBABILITY: {
    weights: { low: 0.3, medium: 0.15, high: 0.05, critical: 0.01 },
    maxScore: 10
  }
};

export function analyzeDealTrends(
  deals: Deal[],
  filters: TrendFilters = {}
): { trends: DealTrend[]; insights: TrendInsights } {
  // Filter deals based on criteria
  let filteredDeals = deals.filter(deal => deal.stage !== 'closed_won' && deal.stage !== 'closed_lost');

  if (filters.transportationMode) {
    filteredDeals = filteredDeals.filter(deal => deal.transportation_mode === filters.transportationMode);
  }

  if (filters.salesRep) {
    filteredDeals = filteredDeals.filter(deal => deal.sales_rep === filters.salesRep);
  }

  if (filters.dealSizeCategory) {
    const category = getDealSizeCategory(filters.dealSizeCategory);
    if (category) {
      filteredDeals = filteredDeals.filter(
        deal => deal.value >= category.minValue && deal.value <= category.maxValue
      );
    }
  }

  // Calculate trends for each deal
  const trends: DealTrend[] = filteredDeals.map(deal => {
    const trend = calculateDealTrend(deal);
    
    // Apply additional filters
    if (filters.riskLevel && trend.riskLevel !== filters.riskLevel) return null;
    if (filters.priority && trend.priority !== filters.priority) return null;
    if (filters.isStalling !== undefined && trend.isStalling !== filters.isStalling) return null;
    
    return trend;
  }).filter(Boolean) as DealTrend[];

  // Sort by priority and risk score
  trends.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.riskScore - a.riskScore;
  });

  // Generate insights
  const insights = generateTrendInsights(trends);

  return { trends, insights };
}

function calculateDealTrend(deal: Deal): DealTrend {
  const now = new Date();
  const lastActivity = new Date(deal.updated_date);
  const expectedClose = new Date(deal.expected_close_date);
  
  const daysInStage = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilClose = Math.floor((expectedClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate risk score
  const riskScore = calculateRiskScore(deal, daysInStage, daysUntilClose);
  const riskLevel = getRiskLevel(riskScore);
  const priority = calculatePriority(deal, riskScore, daysInStage, daysUntilClose);
  
  // Determine if deal is stalling (21+ days in stage)
  const isStalling = daysInStage >= 21;
  
  // Generate risk factors
  const riskFactors = generateRiskFactors(deal, daysInStage, daysUntilClose);
  
  // Generate recommendations
  const recommendations = generateRecommendations(deal, riskLevel, daysInStage, daysUntilClose);
  
  return {
    dealId: deal.deal_id,
    companyName: deal.company_name,
    salesRep: deal.sales_rep,
    transportationMode: deal.transportation_mode,
    currentStage: deal.stage,
    value: deal.value,
    daysInStage,
    lastActivityDate: deal.updated_date,
    riskScore,
    riskLevel,
    riskFactors,
    recommendations,
    stageProbability: STAGE_PROBABILITIES[deal.stage] || 0.1,
    expectedCloseDate: deal.expected_close_date,
    daysUntilClose,
    isStalling,
    priority
  };
}

function calculateRiskScore(deal: Deal, daysInStage: number, daysUntilClose: number): number {
  let score = 0;
  
  // Days in stage risk
  const stageThresholds = RISK_FACTORS.DAYS_IN_STAGE.weights[deal.stage as keyof typeof RISK_FACTORS.DAYS_IN_STAGE.weights] || 
                         RISK_FACTORS.DAYS_IN_STAGE.weights.qualified;
  
  if (daysInStage >= stageThresholds.critical) {
    score += RISK_FACTORS.DAYS_IN_STAGE.maxScore;
  } else if (daysInStage >= stageThresholds.high) {
    score += RISK_FACTORS.DAYS_IN_STAGE.maxScore * 0.75;
  } else if (daysInStage >= stageThresholds.medium) {
    score += RISK_FACTORS.DAYS_IN_STAGE.maxScore * 0.5;
  }
  
  // Days until close risk
  if (daysUntilClose <= RISK_FACTORS.DAYS_UNTIL_CLOSE.weights.critical) {
    score += RISK_FACTORS.DAYS_UNTIL_CLOSE.maxScore;
  } else if (daysUntilClose <= RISK_FACTORS.DAYS_UNTIL_CLOSE.weights.high) {
    score += RISK_FACTORS.DAYS_UNTIL_CLOSE.maxScore * 0.75;
  } else if (daysUntilClose <= RISK_FACTORS.DAYS_UNTIL_CLOSE.weights.medium) {
    score += RISK_FACTORS.DAYS_UNTIL_CLOSE.maxScore * 0.5;
  }
  
  // Deal size risk (larger deals = higher risk)
  if (deal.value >= RISK_FACTORS.DEAL_SIZE.weights.critical) {
    score += RISK_FACTORS.DEAL_SIZE.maxScore;
  } else if (deal.value >= RISK_FACTORS.DEAL_SIZE.weights.high) {
    score += RISK_FACTORS.DEAL_SIZE.maxScore * 0.75;
  } else if (deal.value >= RISK_FACTORS.DEAL_SIZE.weights.medium) {
    score += RISK_FACTORS.DEAL_SIZE.maxScore * 0.5;
  }
  
  // Stage probability risk (lower probability = higher risk)
  const stageProb = STAGE_PROBABILITIES[deal.stage] || 0.1;
  if (stageProb <= RISK_FACTORS.STAGE_PROBABILITY.weights.critical) {
    score += RISK_FACTORS.STAGE_PROBABILITY.maxScore;
  } else if (stageProb <= RISK_FACTORS.STAGE_PROBABILITY.weights.high) {
    score += RISK_FACTORS.STAGE_PROBABILITY.maxScore * 0.75;
  } else if (stageProb <= RISK_FACTORS.STAGE_PROBABILITY.weights.medium) {
    score += RISK_FACTORS.STAGE_PROBABILITY.maxScore * 0.5;
  }
  
  return Math.min(score, 100);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function calculatePriority(deal: Deal, riskScore: number, daysInStage: number, daysUntilClose: number): 'low' | 'medium' | 'high' | 'urgent' {
  // High value deals with high risk get urgent priority
  if (deal.value >= 100000 && riskScore >= 70) return 'urgent';
  
  // Deals closing soon with high risk
  if (daysUntilClose <= 7 && riskScore >= 50) return 'urgent';
  
  // Stalling deals with high value
  if (daysInStage >= 21 && deal.value >= 50000) return 'high';
  
  // High risk deals
  if (riskScore >= 70) return 'high';
  
  // Medium risk or stalling deals
  if (riskScore >= 50 || daysInStage >= 21) return 'medium';
  
  return 'low';
}

function generateRiskFactors(deal: Deal, daysInStage: number, daysUntilClose: number): string[] {
  const factors: string[] = [];
  
  if (daysInStage >= 21) {
    factors.push(`Stalled for ${daysInStage} days in ${deal.stage} stage`);
  }
  
  if (daysUntilClose <= 7) {
    factors.push(`Expected to close in ${daysUntilClose} days`);
  } else if (daysUntilClose <= 30) {
    factors.push(`Expected to close in ${daysUntilClose} days`);
  }
  
  if (deal.value >= 100000) {
    factors.push(`High-value deal ($${deal.value.toLocaleString()})`);
  }
  
  const stageProb = STAGE_PROBABILITIES[deal.stage] || 0.1;
  if (stageProb <= 0.15) {
    factors.push(`Low conversion probability (${Math.round(stageProb * 100)}%)`);
  }
  
  return factors;
}

function generateRecommendations(deal: Deal, riskLevel: string, daysInStage: number, daysUntilClose: number): string[] {
  const recommendations: string[] = [];
  
  if (daysInStage >= 21) {
    recommendations.push('🚨 IMMEDIATE: Schedule customer meeting to advance deal');
    recommendations.push('📞 Contact customer to understand blockers');
  }
  
  if (daysUntilClose <= 7) {
    recommendations.push('⏰ URGENT: Finalize proposal and send to customer');
    recommendations.push('🤝 Schedule closing meeting with decision makers');
  }
  
  if (riskLevel === 'critical') {
    recommendations.push('🔴 CRITICAL: Escalate to senior management');
    recommendations.push('💰 Consider discount or special terms to accelerate');
  }
  
  if (deal.value >= 100000) {
    recommendations.push('💎 High-value deal - ensure executive involvement');
  }
  
  const stageProb = STAGE_PROBABILITIES[deal.stage] || 0.1;
  if (stageProb <= 0.15) {
    recommendations.push('🎯 Focus on qualification and discovery');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Deal appears healthy - maintain regular follow-up');
  }
  
  return recommendations;
}

function generateTrendInsights(trends: DealTrend[]): TrendInsights {
  const stallingDeals = trends.filter(trend => trend.isStalling);
  const highRiskDeals = trends.filter(trend => trend.riskLevel === 'high' || trend.riskLevel === 'critical');
  
  const dealsByRiskLevel = {
    low: trends.filter(t => t.riskLevel === 'low').length,
    medium: trends.filter(t => t.riskLevel === 'medium').length,
    high: trends.filter(t => t.riskLevel === 'high').length,
    critical: trends.filter(t => t.riskLevel === 'critical').length,
  };
  
  const dealsByPriority = {
    low: trends.filter(t => t.priority === 'low').length,
    medium: trends.filter(t => t.priority === 'medium').length,
    high: trends.filter(t => t.priority === 'high').length,
    urgent: trends.filter(t => t.priority === 'urgent').length,
  };
  
  const totalValueAtRisk = highRiskDeals.reduce((sum, deal) => sum + deal.value, 0);
  const averageRiskScore = trends.length > 0 ? trends.reduce((sum, deal) => sum + deal.riskScore, 0) / trends.length : 0;
  
  const recommendations = generateInsightRecommendations(trends, dealsByRiskLevel, dealsByPriority);
  
  return {
    totalDeals: trends.length,
    stallingDeals: stallingDeals.length,
    highRiskDeals: highRiskDeals.length,
    averageRiskScore: Math.round(averageRiskScore),
    dealsByRiskLevel,
    dealsByPriority,
    totalValueAtRisk,
    recommendations
  };
}

function generateInsightRecommendations(trends: DealTrend[], riskLevels: any, priorities: any): string[] {
  const recommendations: string[] = [];
  
  if (riskLevels.critical > 0) {
    recommendations.push(`🚨 CRITICAL: ${riskLevels.critical} deals need immediate attention`);
  }
  
  if (priorities.urgent > 0) {
    recommendations.push(`⚡ URGENT: Focus on ${priorities.urgent} high-priority deals first`);
  }
  
  const stallingDeals = trends.filter(t => t.isStalling);
  if (stallingDeals.length > 0) {
    recommendations.push(`⏰ STALLING: ${stallingDeals.length} deals have been inactive for 21+ days`);
  }
  
  const highValueAtRisk = trends.filter(t => t.value >= 100000 && t.riskLevel !== 'low');
  if (highValueAtRisk.length > 0) {
    recommendations.push(`💰 HIGH VALUE: ${highValueAtRisk.length} high-value deals at risk`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Pipeline health appears good - maintain regular monitoring');
  }
  
  return recommendations;
}

function getDealSizeCategory(category: string): { minValue: number; maxValue: number } | null {
  const categories = {
    'Small': { minValue: 0, maxValue: 10000 },
    'Medium': { minValue: 10001, maxValue: 50000 },
    'Large': { minValue: 50001, maxValue: 200000 },
    'Enterprise': { minValue: 200001, maxValue: Infinity }
  };
  return categories[category as keyof typeof categories] || null;
} 