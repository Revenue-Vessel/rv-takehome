import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../data-source";
import { getStageAnalytics } from "../../../lib/business/deals/analytics";
import { Deal } from "../../../lib/entities/deals/Deal";
import { validateAndSaveDeal } from "../../../lib/persistence/deals";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);

    // Check if the request body is an array for batch processing
    if (Array.isArray(body)) {
      const results: {
        success: number;
        errors: { deal_id: string; error: any }[];
      } = { success: 0, errors: [] };

      for (const deal of body) {
        const result = await validateAndSaveDeal(deal, dealRepository);
        if (result.success) {
          results.success++;
        } else {
          results.errors.push(result);
        }
      }

      return NextResponse.json(results, { status: 207 });
    }

    // Single deal processing
    const result = await validateAndSaveDeal(body, dealRepository);
    if (result.success) {
      return NextResponse.json({ deal_id: result.deal_id }, { status: 201 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/deals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Trend Detection: Stalled Deals with Risk Scoring
    if (searchParams.get("stalled") === "1") {
      const DEFAULT_STALLED_DAYS = 21;
      function daysSince(dateString: string): number {
        const lastChange = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - lastChange.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      }
      function riskScore(daysStalled: number, threshold: number): number {
        if (daysStalled < threshold) return 0;
        if (daysStalled < threshold * 2) return 1;
        return 2;
      }
      const stalledDays = parseInt(
        searchParams.get("stalled_days") || String(DEFAULT_STALLED_DAYS),
        10
      );
      const dataSource = await initializeDataSource();
      const dealRepository = dataSource.getRepository(Deal);
      const deals = await dealRepository.find();
      const stalledDeals = deals
        .map((deal: Deal) => {
          const days = daysSince(deal.updated_date || deal.created_date);
          const score = riskScore(days, stalledDays);
          if (score > 0) {
            return {
              deal_id: deal.deal_id,
              company_name: deal.company_name,
              owner: deal.sales_rep,
              stage: deal.stage,
              value: deal.value,
              last_stage_change: deal.updated_date || deal.created_date,
              days_stalled: days,
              risk_score: score,
            };
          }
          return null;
        })
        .filter(Boolean);
      return NextResponse.json(stalledDeals);
    }

    // Normal analytics response
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const deals = await dealRepository.find();
    const { totalDeals, stageAnalytics } = getStageAnalytics(deals);

    return NextResponse.json({
      totalDeals,
      stageAnalytics,
    });
  } catch (error) {
    console.error("Error fetching deals by stage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET_stalled(request: NextRequest) {
  const DEFAULT_STALLED_DAYS = 21;
  function daysSince(dateString: string): number {
    const lastChange = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - lastChange.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  function riskScore(daysStalled: number, threshold: number): number {
    if (daysStalled < threshold) return 0;
    if (daysStalled < threshold * 2) return 1;
    return 2;
  }
  try {
    const { searchParams } = new URL(request.url);
    const stalledDays = parseInt(
      searchParams.get("stalled_days") || String(DEFAULT_STALLED_DAYS),
      10
    );
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const deals = await dealRepository.find();
    const stalledDeals = deals
      .map((deal: Deal) => {
        const days = daysSince(deal.updated_date || deal.created_date);
        const score = riskScore(days, stalledDays);
        if (score > 0) {
          return {
            deal_id: deal.deal_id,
            company_name: deal.company_name,
            owner: deal.sales_rep,
            stage: deal.stage,
            value: deal.value,
            last_stage_change: deal.updated_date || deal.created_date,
            days_stalled: days,
            risk_score: score,
          };
        }
        return null;
      })
      .filter(Boolean);
    return NextResponse.json(stalledDeals);
  } catch (error) {
    console.error("Error in GET_stalled /api/deals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
