import { Deal } from "../../entities/deals/Deal";

export interface WinRateAnalysis {
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  averageDealSize: number;
  averageWonDealSize: number;
  averageLostDealSize: number;
}

export interface DealSizeCategory {
  category: string;
  minValue: number;
  maxValue: number;
}

export interface HistoricalAnalysisFilters {
  transportationMode?: string;
  salesRep?: string;
  dealSizeCategory?: string;
  startDate?: string;
  endDate?: string;
  stage?: string;
}

export interface HistoricalAnalysisResult {
  overall: WinRateAnalysis;
  byTransportationMode: Record<string, WinRateAnalysis>;
  bySalesRep: Record<string, WinRateAnalysis>;
  byDealSize: Record<string, WinRateAnalysis>;
  byTimePeriod: Record<string, WinRateAnalysis>;
  insights: string[];
}

// Define deal size categories
export const DEAL_SIZE_CATEGORIES: DealSizeCategory[] = [
  { category: "Small", minValue: 0, maxValue: 10000 },
  { category: "Medium", minValue: 10001, maxValue: 50000 },
  { category: "Large", minValue: 50001, maxValue: 200000 },
  { category: "Enterprise", minValue: 200001, maxValue: Infinity },
];

export function calculateHistoricalAnalysis(
  deals: Deal[],
  filters: HistoricalAnalysisFilters = {}
): HistoricalAnalysisResult {
  // Filter deals based on criteria
  let filteredDeals = deals;

  if (filters.transportationMode) {
    filteredDeals = filteredDeals.filter(
      (deal) => deal.transportation_mode === filters.transportationMode
    );
  }

  if (filters.salesRep) {
    filteredDeals = filteredDeals.filter(
      (deal) => deal.sales_rep === filters.salesRep
    );
  }

  if (filters.dealSizeCategory) {
    const category = DEAL_SIZE_CATEGORIES.find(cat => cat.category === filters.dealSizeCategory);
    if (category) {
      filteredDeals = filteredDeals.filter(
        (deal) => deal.value >= category.minValue && deal.value <= category.maxValue
      );
    }
  }

  if (filters.startDate) {
    filteredDeals = filteredDeals.filter(
      (deal) => new Date(deal.expected_close_date) >= new Date(filters.startDate!)
    );
  }

  if (filters.endDate) {
    filteredDeals = filteredDeals.filter(
      (deal) => new Date(deal.expected_close_date) <= new Date(filters.endDate!)
    );
  }

  if (filters.stage) {
    filteredDeals = filteredDeals.filter((deal) => deal.stage === filters.stage);
  }

  // Only include closed deals for win rate analysis
  const closedDeals = filteredDeals.filter(
    (deal) => deal.stage === "closed_won" || deal.stage === "closed_lost"
  );

  const overall = calculateWinRateAnalysis(closedDeals);
  const byTransportationMode = calculateWinRateByTransportationMode(closedDeals);
  const bySalesRep = calculateWinRateBySalesRep(closedDeals);
  const byDealSize = calculateWinRateByDealSize(closedDeals);
  const byTimePeriod = calculateWinRateByTimePeriod(closedDeals);
  const insights = generateInsights(overall, byTransportationMode, bySalesRep, byDealSize);

  return {
    overall,
    byTransportationMode,
    bySalesRep,
    byDealSize,
    byTimePeriod,
    insights,
  };
}

function calculateWinRateAnalysis(deals: Deal[]): WinRateAnalysis {
  const wonDeals = deals.filter((deal) => deal.stage === "closed_won");
  const lostDeals = deals.filter((deal) => deal.stage === "closed_lost");
  
  const totalDeals = deals.length;
  const wonCount = wonDeals.length;
  const lostCount = lostDeals.length;
  
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const lostValue = lostDeals.reduce((sum, deal) => sum + deal.value, 0);
  
  const winRate = totalDeals > 0 ? (wonCount / totalDeals) * 100 : 0;
  const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
  const averageWonDealSize = wonCount > 0 ? wonValue / wonCount : 0;
  const averageLostDealSize = lostCount > 0 ? lostValue / lostCount : 0;

  return {
    totalDeals,
    wonDeals: wonCount,
    lostDeals: lostCount,
    winRate: Math.round(winRate * 100) / 100,
    totalValue: Math.round(totalValue * 100) / 100,
    wonValue: Math.round(wonValue * 100) / 100,
    lostValue: Math.round(lostValue * 100) / 100,
    averageDealSize: Math.round(averageDealSize * 100) / 100,
    averageWonDealSize: Math.round(averageWonDealSize * 100) / 100,
    averageLostDealSize: Math.round(averageLostDealSize * 100) / 100,
  };
}

function calculateWinRateByTransportationMode(deals: Deal[]): Record<string, WinRateAnalysis> {
  const dealsByMode = groupDealsBy(deals, "transportation_mode");
  const result: Record<string, WinRateAnalysis> = {};

  Object.entries(dealsByMode).forEach(([mode, modeDeals]) => {
    result[mode] = calculateWinRateAnalysis(modeDeals);
  });

  return result;
}

function calculateWinRateBySalesRep(deals: Deal[]): Record<string, WinRateAnalysis> {
  const dealsByRep = groupDealsBy(deals, "sales_rep");
  const result: Record<string, WinRateAnalysis> = {};

  Object.entries(dealsByRep).forEach(([rep, repDeals]) => {
    result[rep] = calculateWinRateAnalysis(repDeals);
  });

  return result;
}

function calculateWinRateByDealSize(deals: Deal[]): Record<string, WinRateAnalysis> {
  const result: Record<string, WinRateAnalysis> = {};

  DEAL_SIZE_CATEGORIES.forEach((category) => {
    const categoryDeals = deals.filter(
      (deal) => deal.value >= category.minValue && deal.value <= category.maxValue
    );
    result[category.category] = calculateWinRateAnalysis(categoryDeals);
  });

  return result;
}

function calculateWinRateByTimePeriod(deals: Deal[]): Record<string, WinRateAnalysis> {
  const result: Record<string, WinRateAnalysis> = {};
  
  // Group by month
  const months: Record<string, Deal[]> = {};

  deals.forEach((deal) => {
    const dealDate = new Date(deal.expected_close_date);
    const monthKey = `${dealDate.getFullYear()}-${String(dealDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!months[monthKey]) {
      months[monthKey] = [];
    }
    months[monthKey].push(deal);
  });

  Object.entries(months).forEach(([month, monthDeals]) => {
    result[month] = calculateWinRateAnalysis(monthDeals);
  });

  return result;
}

function groupDealsBy(deals: Deal[], key: keyof Deal): Record<string, Deal[]> {
  return deals.reduce((acc: Record<string, Deal[]>, deal: Deal) => {
    const value = deal[key] as string;
    if (!acc[value]) {
      acc[value] = [];
    }
    acc[value].push(deal);
    return acc;
  }, {});
}

function generateInsights(
  overall: WinRateAnalysis,
  byTransportationMode: Record<string, WinRateAnalysis>,
  bySalesRep: Record<string, WinRateAnalysis>,
  byDealSize: Record<string, WinRateAnalysis>
): string[] {
  const insights: string[] = [];

  // Overall win rate insights
  if (overall.winRate < 50) {
    insights.push("Overall win rate is below 50%, indicating need for sales process improvement");
  } else if (overall.winRate > 70) {
    insights.push("Strong overall win rate above 70% - excellent sales performance");
  }

  // Deal size insights
  const smallDeals = byDealSize["Small"];
  const enterpriseDeals = byDealSize["Enterprise"];
  
  if (smallDeals && enterpriseDeals) {
    if (smallDeals.winRate > enterpriseDeals.winRate + 20) {
      insights.push("Team excels at small deals but struggles with enterprise deals - consider enterprise sales training");
    } else if (enterpriseDeals.winRate > smallDeals.winRate + 20) {
      insights.push("Team performs well on enterprise deals but may need help with smaller, high-volume deals");
    }
  }

  // Transportation mode insights
  const modeWinRates = Object.entries(byTransportationMode).map(([mode, analysis]) => ({
    mode,
    winRate: analysis.winRate,
  }));
  
  if (modeWinRates.length > 1) {
    const bestMode = modeWinRates.reduce((best, current) => 
      current.winRate > best.winRate ? current : best
    );
    const worstMode = modeWinRates.reduce((worst, current) => 
      current.winRate < worst.winRate ? current : worst
    );
    
    if (bestMode.winRate - worstMode.winRate > 30) {
      insights.push(`Significant performance gap: ${bestMode.mode} (${bestMode.winRate}%) vs ${worstMode.mode} (${worstMode.winRate}%) - consider cross-training`);
    }
  }

  // Sales rep insights
  const repWinRates = Object.entries(bySalesRep).map(([rep, analysis]) => ({
    rep,
    winRate: analysis.winRate,
    dealCount: analysis.totalDeals,
  }));
  
  if (repWinRates.length > 1) {
    const topPerformer = repWinRates.reduce((top, current) => 
      current.winRate > top.winRate ? current : top
    );
    const needsHelp = repWinRates.filter(rep => rep.winRate < 40 && rep.dealCount >= 5);
    
    if (needsHelp.length > 0) {
      insights.push(`${needsHelp.length} sales rep(s) with win rates below 40% may need additional coaching`);
    }
    
    if (topPerformer.winRate > 70) {
      insights.push(`${topPerformer.rep} is a top performer (${topPerformer.winRate}% win rate) - consider having them mentor others`);
    }
  }

  return insights;
} 