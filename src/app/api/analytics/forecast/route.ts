import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";

// Forecasts revenue for the next 3 months based on weighted pipeline value
export async function GET(request: NextRequest) {
  try {
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const deals = await dealRepository.find();

    // Today's date
    const now = new Date();
    // Helper to get YYYY-MM for a date
    const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    // Build forecast for next 3 months
    const forecast: Record<string, { forecasted_revenue: number; deals: string[] }> = {};
    for (let i = 0; i < 3; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = getMonthKey(month);
      forecast[key] = { forecasted_revenue: 0, deals: [] };
    }

    for (const deal of deals) {
      if (!deal.expected_close_date || !deal.value || !deal.probability) continue;
      const closeDate = new Date(deal.expected_close_date);
      const key = getMonthKey(closeDate);
      if (forecast[key]) {
        forecast[key].forecasted_revenue += deal.value * (deal.probability / 100);
        forecast[key].deals.push(deal.deal_id);
      }
    }

    return NextResponse.json({ forecast });
  } catch (error) {
    console.error("Error in GET /api/analytics/forecast:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
