import { Deal } from "../../entities/deals/Deal";

export interface MonthlyForecast {
  month: string;
  monthLabel: string;
  alreadyWon: number;
  predictedRevenue: number;
  totalRevenue: number;
  dealCount: number;
}

export interface DealFilter {
  month?: string;
  type?: 'won' | 'expected' | 'all';
}

/**
 * Calculate the average deal duration from created_date to updated_date for closed won deals
 * Returns null if no historical data is available
 */
export function calculateAverageDealDuration(closedWonDeals: Deal[]): number | null {
  if (closedWonDeals.length === 0) return null;
  
  const dealDurations = closedWonDeals.map(deal => {
    const created = new Date(deal.created_date);
    const updated = new Date(deal.updated_date);
    return Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  });
  
  return dealDurations.reduce((sum, duration) => sum + duration, 0) / dealDurations.length;
}

/**
 * Calculate the predicted close date for a deal
 * Uses expected_close_date if no historical data, otherwise uses the later of expected and predicted dates
 */
export function calculatePredictedCloseDate(deal: Deal, avgDealDuration: number | null): Date {
  const expectedCloseDate = new Date(deal.expected_close_date);
  
  // If no historical data, only use expected_close_date
  if (avgDealDuration === null) {
    return expectedCloseDate;
  }
  
  // Calculate predicted close date based on historical average duration
  const createdDate = new Date(deal.created_date);
  const predictedCloseDate = new Date(createdDate.getTime() + (avgDealDuration * 24 * 60 * 60 * 1000));
  
  // Use the later of expected_close_date and predicted date
  return new Date(Math.max(expectedCloseDate.getTime(), predictedCloseDate.getTime()));
}

/**
 * Check if a deal is predicted to close within a given month range
 */
export function isDealInMonth(deal: Deal, monthStart: Date, monthEnd: Date, avgDealDuration: number | null): boolean {
  const finalCloseDate = calculatePredictedCloseDate(deal, avgDealDuration);
  return finalCloseDate >= monthStart && finalCloseDate <= monthEnd;
}

/**
 * Get active deals (not closed_won or closed_lost)
 */
function getActiveDeals(allDeals: Deal[]): Deal[] {
  return allDeals.filter(deal => deal.stage !== 'closed_won' && deal.stage !== 'closed_lost');
}

/**
 * Get deals that closed in a specific month
 */
function getDealsClosedInMonth(deals: Deal[], targetMonth: Date): Deal[] {
  return deals.filter(deal => {
    const updatedDate = new Date(deal.updated_date);
    return updatedDate.getMonth() === targetMonth.getMonth() && 
           updatedDate.getFullYear() === targetMonth.getFullYear();
  });
}

/**
 * Calculate monthly forecasts for the next 3 months
 */
export function calculateMonthlyForecasts(
  allDeals: Deal[],
  closedWonDeals: Deal[],
  months: Array<{ date: Date; label: string }>
): MonthlyForecast[] {
  const avgDealDuration = calculateAverageDealDuration(closedWonDeals);
  const activeDeals = getActiveDeals(allDeals);
  
  return months.map((monthInfo, index) => {
    const monthStart = monthInfo.date;
    const monthEnd = new Date(monthInfo.date.getFullYear(), monthInfo.date.getMonth() + 1, 0);
    
    // Calculate predicted revenue from active deals
    const dealsInMonth = activeDeals.filter(deal => 
      isDealInMonth(deal, monthStart, monthEnd, avgDealDuration)
    );
    
    const predictedRevenue = dealsInMonth.reduce((sum, deal) => 
      sum + (deal.value * deal.probability / 100), 0
    );

    // Get already won deals for current month (index 0)
    const currentMonthWonDeals = index === 0 ? getDealsClosedInMonth(closedWonDeals, monthInfo.date) : [];
    const alreadyWonRevenue = currentMonthWonDeals.reduce((sum, deal) => sum + deal.value, 0);

    return {
      month: monthInfo.date.toISOString().slice(0, 7), // YYYY-MM format
      monthLabel: monthInfo.label,
      alreadyWon: alreadyWonRevenue,
      predictedRevenue,
      totalRevenue: alreadyWonRevenue + predictedRevenue,
      dealCount: dealsInMonth.length
    };
  });
}

/**
 * Filter deals based on forecast criteria
 */
export function filterDealsByForecast(
  deals: Deal[],
  filter: DealFilter,
  closedWonDeals: Deal[]
): Deal[] {
  if (!filter?.month) return deals;

  // Parse the month correctly - filter.month is in "YYYY-MM" format
  const [year, month] = filter.month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  const avgDealDuration = calculateAverageDealDuration(closedWonDeals);

  return deals.filter(deal => {
    const isInMonth = isDealInMonth(deal, monthStart, monthEnd, avgDealDuration);

    if (filter.type === 'won') {
      return deal.stage === 'closed_won' && isInMonth;
    } else if (filter.type === 'expected') {
      return deal.stage !== 'closed_won' && deal.stage !== 'closed_lost' && isInMonth;
    } else {
      // 'all' - show all deals in the month
      return isInMonth;
    }
  });
} 