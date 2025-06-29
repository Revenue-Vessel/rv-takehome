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
 */
export function calculateAverageDealDuration(closedWonDeals: Deal[]): number {
  if (closedWonDeals.length === 0) return 90; // Default to 90 days if no historical data
  
  const dealDurations: number[] = [];
  closedWonDeals.forEach(deal => {
    const created = new Date(deal.created_date);
    const updated = new Date(deal.updated_date);
    const durationInDays = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    dealDurations.push(durationInDays);
  });
  
  return dealDurations.reduce((sum, duration) => sum + duration, 0) / dealDurations.length;
}

/**
 * Calculate the predicted close date for a deal based on historical data and expected close date
 * Uses the LATER of expected_close_date and predicted date (based on historical average) for all stages
 */
export function calculatePredictedCloseDate(deal: Deal, avgDealDuration: number): Date {
  const createdDate = new Date(deal.created_date);
  const expectedCloseDate = new Date(deal.expected_close_date);
  
  // Calculate predicted close date based on historical average duration
  const predictedCloseDate = new Date(createdDate.getTime() + (avgDealDuration * 24 * 60 * 60 * 1000));
  
  // Use the LATER of expected_close_date and predicted date for all stages
  return new Date(Math.max(expectedCloseDate.getTime(), predictedCloseDate.getTime()));
}

/**
 * Check if a deal is predicted to close within a given month range
 */
export function isDealInMonth(deal: Deal, monthStart: Date, monthEnd: Date, avgDealDuration: number): boolean {
  const finalCloseDate = calculatePredictedCloseDate(deal, avgDealDuration);
  return finalCloseDate >= monthStart && finalCloseDate <= monthEnd;
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
  
  return months.map((monthInfo, index) => {
    const monthStart = monthInfo.date;
    const monthEnd = new Date(monthInfo.date.getFullYear(), monthInfo.date.getMonth() + 1, 0);
    
    let predictedRevenue = 0;
    let dealCount = 0;

    // Filter active deals (not closed_won or closed_lost)
    const activeDeals = allDeals.filter(deal => 
      deal.stage !== 'closed_won' && deal.stage !== 'closed_lost'
    );

    activeDeals.forEach(deal => {
      if (isDealInMonth(deal, monthStart, monthEnd, avgDealDuration)) {
        // Apply probability to the deal value
        const probableValue = deal.value * (deal.probability / 100);
        predictedRevenue += probableValue;
        dealCount++;
      }
    });

    // Get already won deals for current month (index 0)
    const currentMonthWonDeals = index === 0 ? closedWonDeals.filter(deal => {
      const updatedDate = new Date(deal.updated_date);
      return updatedDate.getMonth() === monthInfo.date.getMonth() && 
             updatedDate.getFullYear() === monthInfo.date.getFullYear();
    }) : [];

    const alreadyWonRevenue = currentMonthWonDeals.reduce((sum, deal) => sum + deal.value, 0);

    return {
      month: monthInfo.date.toISOString().slice(0, 7), // YYYY-MM format
      monthLabel: monthInfo.label,
      alreadyWon: alreadyWonRevenue,
      predictedRevenue,
      totalRevenue: alreadyWonRevenue + predictedRevenue,
      dealCount
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