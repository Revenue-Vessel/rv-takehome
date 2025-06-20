import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";
import { 
  calculateRevenueForecast, 
  ForecastingFilters 
} from "../../../../lib/business/deals/forecasting";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);

    // Get all deals
    const deals = await dealRepository.find();

    // Parse query parameters for filtering
    const filters: ForecastingFilters = {};

    const transportationMode = searchParams.get("transportationMode");
    if (transportationMode) {
      filters.transportationMode = transportationMode;
    }

    const salesRep = searchParams.get("salesRep");
    if (salesRep) {
      filters.salesRep = salesRep;
    }

    const dealSizeCategory = searchParams.get("dealSizeCategory");
    if (dealSizeCategory) {
      filters.dealSizeCategory = dealSizeCategory;
    }

    const startDate = searchParams.get("startDate");
    if (startDate) {
      filters.startDate = startDate;
    }

    const endDate = searchParams.get("endDate");
    if (endDate) {
      filters.endDate = endDate;
    }

    // Get forecast parameters
    const monthsToForecast = parseInt(searchParams.get("monthsToForecast") || "6");
    const quotaTarget = searchParams.get("quotaTarget") ? 
      parseFloat(searchParams.get("quotaTarget")!) : undefined;

    // Calculate revenue forecast
    const result = calculateRevenueForecast(deals, monthsToForecast, quotaTarget, filters);

    return NextResponse.json({
      success: true,
      data: result,
      filters: {
        applied: filters,
        available: {
          transportationModes: ["trucking", "rail", "ocean", "air"],
          dealSizeCategories: ["Small", "Medium", "Large", "Enterprise"],
          monthsToForecast: monthsToForecast,
          quotaTarget: quotaTarget
        }
      }
    });

  } catch (error) {
    console.error("Error in revenue forecasting:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);

    // Get all deals
    const deals = await dealRepository.find();

    // Use parameters from request body
    const filters: ForecastingFilters = body.filters || {};
    const monthsToForecast = body.monthsToForecast || 6;
    const quotaTarget = body.quotaTarget;

    // Calculate revenue forecast
    const result = calculateRevenueForecast(deals, monthsToForecast, quotaTarget, filters);

    return NextResponse.json({
      success: true,
      data: result,
      filters: {
        applied: filters,
        available: {
          transportationModes: ["trucking", "rail", "ocean", "air"],
          dealSizeCategories: ["Small", "Medium", "Large", "Enterprise"],
          monthsToForecast: monthsToForecast,
          quotaTarget: quotaTarget
        }
      }
    });

  } catch (error) {
    console.error("Error in revenue forecasting POST:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 