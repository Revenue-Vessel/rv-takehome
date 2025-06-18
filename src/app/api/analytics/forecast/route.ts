import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";

// Helper to get quarter key like "2025-Q3"
function getQuarterKey(date: Date) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

// Forecasts revenue for the next 3 months, grouped by quarter
export async function GET(request: NextRequest) {
  try {
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const deals = await dealRepository.find();

    // Today's date
    const now = new Date();

    // Calculate the end date (3 months from now)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);

    // Group forecast by quarter
    const forecast: Record<string, { forecasted_revenue: number; deals: string[] }> = {};

    let hasForecast = false;

    for (const deal of deals) {
      if (!deal.expected_close_date || !deal.value || !deal.probability) continue;
      const closeDate = new Date(deal.expected_close_date);

      // Only include deals closing in the next 3 months
      if (closeDate >= now && closeDate < endDate) {
        const key = getQuarterKey(closeDate);
        if (!forecast[key]) {
          forecast[key] = { forecasted_revenue: 0, deals: [] };
        }
        forecast[key].forecasted_revenue += deal.value * (deal.probability / 100);
        forecast[key].deals.push(deal.deal_id);
        hasForecast = true;
      }
    }

    if (!hasForecast) {
      return NextResponse.json({
        forecast: {},
        message:
          "No deals expected to close in the next 3 months. Please check your data or add upcoming deals.",
      });
    }

    return NextResponse.json({ forecast });
  } catch (error) {
    console.error("Error in GET /api/analytics/forecast:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
