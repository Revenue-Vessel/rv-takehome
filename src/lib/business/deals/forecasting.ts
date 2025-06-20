import { Deal } from "../../entities/deals/Deal";

export interface RevenueForecast {
  month: string;
  predictedRevenue: number;
  confidence: number;
  dealCount: number;
  weightedValue: number;
  historicalAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ForecastInsights {
  totalPredictedRevenue: number;
  averageMonthlyRevenue: number;
  trendAnalysis: string;
  riskFactors: string[];
  recommendations: string[];
  quotaGap?: number;
  quotaTarget?: number;
}

export interface ForecastingFilters {
  transportationMode?: string;
  salesRep?: string;
  dealSizeCategory?: string;
  startDate?: string;
  endDate?: string;
}

// Stage probability weights based on typical sales funnel conversion rates
const STAGE_PROBABILITIES: Record<string, number> = {
  'prospect': 0.05,      // 5% chance of closing
  'qualified': 0.15,     // 15% chance of closing
  'proposal': 0.30,      // 30% chance of closing
  'negotiation': 0.60,   // 60% chance of closing
  'closed_won': 1.0,     // 100% chance (already won)
  'closed_lost': 0.0,    // 0% chance (already lost)
};

// Monthly seasonality factors (1.0 = average month)
const SEASONALITY_FACTORS: Record<string, number> = {
  '01': 0.9,  // January - typically slower
  '02': 0.85, // February - typically slower
  '03': 1.1,  // March - Q1 push
  '04': 1.0,  // April - average
  '05': 1.0,  // May - average
  '06': 1.2,  // June - Q2 push
  '07': 0.9,  // July - summer slowdown
  '08': 0.9,  // August - summer slowdown
  '09': 1.1,  // September - Q3 push
  '10': 1.0,  // October - average
  '11': 1.0,  // November - average
  '12': 1.3,  // December - year-end push
};

export function calculateRevenueForecast(
  deals: Deal[],
  monthsToForecast: number = 6,
  quotaTarget?: number,
  filters: ForecastingFilters = {}
): { forecast: RevenueForecast[]; insights: ForecastInsights } {
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
    const category = getDealSizeCategory(filters.dealSizeCategory);
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

  // Calculate historical patterns
  const historicalData = calculateHistoricalPatterns(deals);
  
  // Generate monthly forecasts
  const forecast: RevenueForecast[] = [];
  const now = new Date();
  
  for (let i = 0; i < monthsToForecast; i++) {
    const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
    const monthNumber = String(forecastDate.getMonth() + 1).padStart(2, '0');
    
    // Get deals expected to close in this month
    const monthDeals = filteredDeals.filter(deal => {
      const closeDate = new Date(deal.expected_close_date);
      return closeDate.getFullYear() === forecastDate.getFullYear() && 
             closeDate.getMonth() === forecastDate.getMonth();
    });

    // Calculate weighted pipeline value
    const weightedValue = monthDeals.reduce((sum, deal) => {
      const probability = STAGE_PROBABILITIES[deal.stage] || 0.1;
      return sum + (deal.value * probability);
    }, 0);

    // Apply seasonality factor
    const seasonalityFactor = SEASONALITY_FACTORS[monthNumber] || 1.0;
    const adjustedWeightedValue = weightedValue * seasonalityFactor;

    // Calculate historical average for this month
    const historicalAverage = historicalData.monthlyAverages[monthNumber] || historicalData.overallAverage;

    // Calculate confidence based on deal count and stage distribution
    const confidence = calculateConfidence(monthDeals, historicalData);

    // Determine trend
    const trend = determineTrend(adjustedWeightedValue, historicalAverage);

    forecast.push({
      month: monthKey,
      predictedRevenue: Math.round(adjustedWeightedValue * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      dealCount: monthDeals.length,
      weightedValue: Math.round(weightedValue * 100) / 100,
      historicalAverage: Math.round(historicalAverage * 100) / 100,
      trend
    });
  }

  // Generate insights
  const insights = generateForecastInsights(forecast, quotaTarget, historicalData);

  return { forecast, insights };
}

function calculateHistoricalPatterns(deals: Deal[]): {
  overallAverage: number;
  monthlyAverages: Record<string, number>;
  winRate: number;
  averageDealSize: number;
} {
  // Only consider closed deals for historical patterns
  const closedDeals = deals.filter(deal => 
    deal.stage === 'closed_won' || deal.stage === 'closed_lost'
  );

  const wonDeals = closedDeals.filter(deal => deal.stage === 'closed_won');
  const winRate = closedDeals.length > 0 ? wonDeals.length / closedDeals.length : 0;
  const averageDealSize = wonDeals.length > 0 ? 
    wonDeals.reduce((sum, deal) => sum + deal.value, 0) / wonDeals.length : 0;

  // Calculate monthly averages from historical data
  const monthlyTotals: Record<string, number[]> = {};
  
  wonDeals.forEach(deal => {
    const closeDate = new Date(deal.expected_close_date);
    const monthKey = String(closeDate.getMonth() + 1).padStart(2, '0');
    
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = [];
    }
    monthlyTotals[monthKey].push(deal.value);
  });

  const monthlyAverages: Record<string, number> = {};
  Object.entries(monthlyTotals).forEach(([month, values]) => {
    monthlyAverages[month] = values.reduce((sum, value) => sum + value, 0) / values.length;
  });

  const overallAverage = wonDeals.length > 0 ? 
    wonDeals.reduce((sum, deal) => sum + deal.value, 0) / wonDeals.length : 0;

  return {
    overallAverage,
    monthlyAverages,
    winRate,
    averageDealSize
  };
}

function calculateConfidence(monthDeals: Deal[], historicalData: any): number {
  if (monthDeals.length === 0) return 0.3; // Low confidence if no deals

  // Base confidence on deal count
  let confidence = Math.min(monthDeals.length / 10, 0.8); // Max 80% from deal count

  // Adjust based on stage distribution
  const stageDistribution = monthDeals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Higher confidence if more deals are in later stages
  const lateStageDeals = (stageDistribution['negotiation'] || 0) + (stageDistribution['proposal'] || 0);
  const lateStageRatio = lateStageDeals / monthDeals.length;
  confidence += lateStageRatio * 0.2; // Add up to 20% for late-stage deals

  return Math.min(confidence, 0.95); // Cap at 95%
}

function determineTrend(predicted: number, historical: number): 'increasing' | 'decreasing' | 'stable' {
  const ratio = predicted / historical;
  if (ratio > 1.1) return 'increasing';
  if (ratio < 0.9) return 'decreasing';
  return 'stable';
}

function generateForecastInsights(
  forecast: RevenueForecast[], 
  quotaTarget?: number,
  historicalData?: any
): ForecastInsights {
  const totalPredictedRevenue = forecast.reduce((sum, month) => sum + month.predictedRevenue, 0);
  const averageMonthlyRevenue = totalPredictedRevenue / forecast.length;

  // Calculate trend analysis
  const firstHalf = forecast.slice(0, Math.ceil(forecast.length / 2));
  const secondHalf = forecast.slice(Math.ceil(forecast.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, month) => sum + month.predictedRevenue, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, month) => sum + month.predictedRevenue, 0) / secondHalf.length;
  
  let trendAnalysis = '';
  if (secondHalfAvg > firstHalfAvg * 1.1) {
    trendAnalysis = 'Revenue is trending upward, indicating strong pipeline momentum.';
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    trendAnalysis = 'Revenue is trending downward, suggesting pipeline challenges.';
  } else {
    trendAnalysis = 'Revenue is stable with consistent pipeline flow.';
  }

  // Identify risk factors
  const riskFactors: string[] = [];
  
  // Low confidence analysis
  const lowConfidenceMonths = forecast.filter(month => month.confidence < 0.5);
  if (lowConfidenceMonths.length > 0) {
    const monthNames = lowConfidenceMonths.map(month => {
      const date = new Date(month.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });
    if (lowConfidenceMonths.length === 1) {
      riskFactors.push(`${monthNames[0]} has low forecast confidence (${Math.round(lowConfidenceMonths[0].confidence * 100)}%) - consider pipeline acceleration`);
    } else {
      riskFactors.push(`${lowConfidenceMonths.length} months (${monthNames.slice(0, 2).join(', ')}${monthNames.length > 2 ? '...' : ''}) have low confidence predictions`);
    }
  }

  // Pipeline depth analysis
  const lowDealCountMonths = forecast.filter(month => month.dealCount < 3);
  if (lowDealCountMonths.length > 0) {
    const monthNames = lowDealCountMonths.map(month => {
      const date = new Date(month.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'long' });
    });
    if (lowDealCountMonths.length === 1) {
      riskFactors.push(`${monthNames[0]} has only ${lowDealCountMonths[0].dealCount} deal(s) in pipeline - pipeline depth concern`);
    } else {
      riskFactors.push(`${lowDealCountMonths.length} months (${monthNames.slice(0, 2).join(', ')}${monthNames.length > 2 ? '...' : ''}) have thin pipeline coverage`);
    }
  }

  // Deal stage distribution analysis
  const allDeals = forecast.reduce((sum, month) => sum + month.dealCount, 0);
  if (allDeals > 0) {
    const earlyStageMonths = forecast.filter(month => {
      // This would need to be calculated from actual deal data, but for now we'll use a proxy
      return month.weightedValue / month.predictedRevenue < 0.4; // Low weighted value suggests early stage deals
    });
    if (earlyStageMonths.length > forecast.length * 0.6) {
      riskFactors.push('Pipeline heavily weighted toward early-stage deals - conversion risk');
    }
  }

  // Seasonal risk analysis
  const seasonalRiskMonths = forecast.filter(month => {
    const monthNumber = month.month.split('-')[1];
    const seasonalityFactor = SEASONALITY_FACTORS[monthNumber] || 1.0;
    return seasonalityFactor < 0.9 && month.predictedRevenue < averageMonthlyRevenue * 0.8;
  });
  if (seasonalRiskMonths.length > 0) {
    const monthNames = seasonalRiskMonths.map(month => {
      const date = new Date(month.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'long' });
    });
    riskFactors.push(`Seasonal slowdown expected in ${monthNames.slice(0, 2).join(', ')}${monthNames.length > 2 ? '...' : ''} - plan accordingly`);
  }

  // Revenue concentration risk
  const totalRevenue = forecast.reduce((sum, month) => sum + month.predictedRevenue, 0);
  const highestMonth = forecast.reduce((max, month) => month.predictedRevenue > max.predictedRevenue ? month : max);
  if (highestMonth.predictedRevenue > totalRevenue * 0.4) {
    const monthName = new Date(highestMonth.month + '-01').toLocaleDateString('en-US', { month: 'long' });
    riskFactors.push(`Revenue heavily concentrated in ${monthName} (${Math.round(highestMonth.predictedRevenue / totalRevenue * 100)}%) - diversification needed`);
  }

  // Trend-based risks
  const decreasingMonths = forecast.filter(month => month.trend === 'decreasing');
  if (decreasingMonths.length > forecast.length * 0.5) {
    riskFactors.push('Downward trend detected across majority of forecast period - pipeline health review required');
  }

  // Quota gap analysis
  if (quotaTarget && totalPredictedRevenue < quotaTarget) {
    const gap = quotaTarget - totalPredictedRevenue;
    const gapPercentage = Math.round((gap / quotaTarget) * 100);
    if (gapPercentage > 20) {
      riskFactors.push(`Significant quota gap (${gapPercentage}% below target) - aggressive pipeline building needed`);
    } else if (gapPercentage > 10) {
      riskFactors.push(`Moderate quota gap (${gapPercentage}% below target) - focus on deal acceleration`);
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  // Quota gap recommendations
  if (quotaTarget && totalPredictedRevenue < quotaTarget) {
    const gap = quotaTarget - totalPredictedRevenue;
    const gapPercentage = Math.round((gap / quotaTarget) * 100);
    const additionalDealsNeeded = Math.ceil(gap / 50000);
    
    if (gapPercentage > 20) {
      recommendations.push(`🚨 CRITICAL: Need ${additionalDealsNeeded} additional deals to close quota gap (${gapPercentage}% below target)`);
      recommendations.push('🔴 Immediate actions: Accelerate all negotiation-stage deals, increase prospecting activity by 50%');
    } else if (gapPercentage > 10) {
      recommendations.push(`⚠️ MODERATE: Focus on closing ${additionalDealsNeeded} additional deals to meet quota (${gapPercentage}% gap)`);
      recommendations.push('🟡 Priority: Move 3-5 qualified deals to proposal stage this week');
    } else {
      recommendations.push(`✅ ON TRACK: Close ${additionalDealsNeeded} additional deals to exceed quota by ${Math.abs(gapPercentage)}%`);
    }
  } else if (quotaTarget && totalPredictedRevenue > quotaTarget) {
    const surplus = totalPredictedRevenue - quotaTarget;
    const surplusPercentage = Math.round((surplus / quotaTarget) * 100);
    recommendations.push(`🎯 EXCEEDING TARGET: Forecast shows ${surplusPercentage}% above quota - maintain momentum`);
  }

  // Pipeline health recommendations
  if (lowConfidenceMonths.length > 0) {
    const lowConfMonthNames = lowConfidenceMonths.map(month => {
      const date = new Date(month.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'long' });
    });
    recommendations.push(`📊 Pipeline Health: Increase activity in ${lowConfMonthNames.slice(0, 2).join(', ')}${lowConfMonthNames.length > 2 ? '...' : ''} - target 5+ deals per month`);
  }

  // Deal stage optimization
  const earlyStageMonths = forecast.filter(month => {
    return month.weightedValue / month.predictedRevenue < 0.4;
  });
  if (earlyStageMonths.length > forecast.length * 0.6) {
    recommendations.push('🎯 Stage Optimization: 60%+ of pipeline in early stages - focus on advancing deals to proposal/negotiation');
  }

  // Seasonal planning
  const seasonalLowMonths = forecast.filter(month => {
    const monthNumber = month.month.split('-')[1];
    const seasonalityFactor = SEASONALITY_FACTORS[monthNumber] || 1.0;
    return seasonalityFactor < 0.9;
  });
  if (seasonalLowMonths.length > 0) {
    const seasonalMonthNames = seasonalLowMonths.map(month => {
      const date = new Date(month.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'long' });
    });
    recommendations.push(`📅 Seasonal Planning: Build extra pipeline for ${seasonalMonthNames.slice(0, 2).join(', ')}${seasonalMonthNames.length > 2 ? '...' : ''} (typically slower months)`);
  }

  // Revenue concentration recommendations
  if (highestMonth.predictedRevenue > totalPredictedRevenue * 0.4) {
    const monthName = new Date(highestMonth.month + '-01').toLocaleDateString('en-US', { month: 'long' });
    const concentration = Math.round(highestMonth.predictedRevenue / totalPredictedRevenue * 100);
    recommendations.push(`⚖️ Revenue Balance: ${monthName} represents ${concentration}% of forecast - diversify across other months`);
  }

  // Trend-based recommendations
  const increasingMonths = forecast.filter(month => month.trend === 'increasing');
  
  if (decreasingMonths.length > forecast.length * 0.5) {
    recommendations.push('📉 Trend Alert: Downward trend detected - review sales process and conversion rates');
  } else if (increasingMonths.length > forecast.length * 0.5) {
    recommendations.push('📈 Momentum: Strong upward trend - capitalize on current sales momentum');
  }

  // Deal size optimization
  const avgDealSize = totalPredictedRevenue / allDeals;
  if (avgDealSize < 50000) {
    recommendations.push('💰 Deal Size: Average deal size below $50k - focus on larger opportunities to improve efficiency');
  } else if (avgDealSize > 150000) {
    recommendations.push('🎯 Large Deals: High-value pipeline - ensure proper resource allocation for complex sales');
  }

  // Pipeline velocity recommendations
  const monthsWithDeals = forecast.filter(month => month.dealCount > 0).length;
  if (monthsWithDeals < forecast.length * 0.7) {
    recommendations.push('⏱️ Pipeline Velocity: Spread deals more evenly across months for consistent revenue flow');
  }

  // Win rate optimization
  if (historicalData && historicalData.winRate < 0.3) {
    recommendations.push('🏆 Win Rate: Historical win rate below 30% - focus on deal qualification and proposal quality');
  } else if (historicalData && historicalData.winRate > 0.6) {
    recommendations.push('✅ Strong Performance: High win rate - consider increasing deal volume to maximize success');
  }

  // Default recommendation if no specific issues
  if (recommendations.length === 0) {
    recommendations.push('✅ Pipeline Health: Maintain current sales momentum and pipeline health');
    recommendations.push('📈 Growth Opportunity: Consider expanding into new markets or product lines');
  }

  return {
    totalPredictedRevenue: Math.round(totalPredictedRevenue * 100) / 100,
    averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
    trendAnalysis,
    riskFactors,
    recommendations,
    quotaGap: quotaTarget ? Math.round((quotaTarget - totalPredictedRevenue) * 100) / 100 : undefined,
    quotaTarget
  };
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