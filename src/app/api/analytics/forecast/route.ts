import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";

// Helper to get month key like "2025-06"
function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

// Helper to get the end of the next quarter
function getEndOfNextQuarter(date: Date) {
  const currentQuarter = Math.floor(date.getMonth() / 3) + 1;
  let endQuarter = currentQuarter + 1;
  let year = date.getFullYear();
  if (endQuarter > 4) {
    endQuarter = 1;
    year += 1;
  }
  // Last month of the quarter: 3, 6, 9, 12 (0-based: 2, 5, 8, 11)
  const lastMonthOfQuarter = endQuarter * 3;
  // Set to first day of the month after the quarter ends
  return new Date(year, lastMonthOfQuarter, 1);
}

function getQuarterKey(date: Date) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

// Forecasts revenue for each month until the end of next quarter
export async function GET(request: NextRequest) {
  try {
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const deals = await dealRepository.find();

    const now = new Date();
    const endDate = getEndOfNextQuarter(now);

    // Pre-populate forecast for all months from now until end of next quarter
    const forecast: Record<string, { forecasted_revenue: number; deals: string[]; quarter: string }> = {};
    let iter = new Date(now.getFullYear(), now.getMonth(), 1);
    while (iter < endDate) {
      forecast[getMonthKey(iter)] = {
        forecasted_revenue: 0,
        deals: [],
        quarter: getQuarterKey(iter),
      };
      iter.setMonth(iter.getMonth() + 1);
    }

    let hasForecast = false;

    for (const deal of deals) {
      if (!deal.expected_close_date || !deal.value || !deal.probability) continue;
      const closeDate = new Date(deal.expected_close_date);

      // Only include deals closing from now until end of next quarter
      if (closeDate >= now && closeDate < endDate) {
        const key = getMonthKey(closeDate);
        if (forecast[key]) {
          forecast[key].forecasted_revenue += deal.value * (deal.probability / 100);
          forecast[key].deals.push(deal.deal_id);
          hasForecast = true;
        }
      }
    }

    if (!hasForecast) {
      return NextResponse.json({
        forecast,
        message:
          "No deals expected to close from now until the end of next quarter. Please check your data or add upcoming deals.",
      });
    }

    return NextResponse.json({ forecast });
  } catch (error) {
    console.error("Error in GET /api/analytics/forecast:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
