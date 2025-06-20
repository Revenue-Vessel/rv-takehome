import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../../data-source";
import { Deal } from "../../../../lib/entities/deals/Deal";
import { 
  calculateHistoricalAnalysis, 
  HistoricalAnalysisFilters,
  DEAL_SIZE_CATEGORIES 
} from "../../../../lib/business/deals/historical-analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);

    // Get all deals
    const deals = await dealRepository.find();

    // Parse query parameters for filtering
    const filters: HistoricalAnalysisFilters = {};

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
      // Validate that the category exists
      const category = DEAL_SIZE_CATEGORIES.find(cat => cat.category === dealSizeCategory);
      if (category) {
        filters.dealSizeCategory = dealSizeCategory;
      }
    }

    const startDate = searchParams.get("startDate");
    if (startDate) {
      filters.startDate = startDate;
    }

    const endDate = searchParams.get("endDate");
    if (endDate) {
      filters.endDate = endDate;
    }

    const stage = searchParams.get("stage");
    if (stage) {
      filters.stage = stage;
    }

    // Calculate historical analysis
    const analysis = calculateHistoricalAnalysis(deals, filters);

    return NextResponse.json({
      success: true,
      data: analysis,
      filters: {
        applied: filters,
        available: {
          transportationModes: ["trucking", "rail", "ocean", "air"],
          dealSizeCategories: DEAL_SIZE_CATEGORIES.map(cat => cat.category),
          stages: ["prospect", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
        }
      }
    });

  } catch (error) {
    console.error("Error in historical analysis:", error);
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

    // Use filters from request body
    const filters: HistoricalAnalysisFilters = body.filters || {};

    // Calculate historical analysis
    const analysis = calculateHistoricalAnalysis(deals, filters);

    return NextResponse.json({
      success: true,
      data: analysis,
      filters: {
        applied: filters,
        available: {
          transportationModes: ["trucking", "rail", "ocean", "air"],
          dealSizeCategories: DEAL_SIZE_CATEGORIES.map(cat => cat.category),
          stages: ["prospect", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
        }
      }
    });

  } catch (error) {
    console.error("Error in historical analysis POST:", error);
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