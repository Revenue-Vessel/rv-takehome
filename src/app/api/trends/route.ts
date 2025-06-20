import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '../../../data-source';
import { Deal } from '../../../lib/entities/deals/Deal';
import { analyzeDealTrends, TrendFilters } from '../../../lib/business/deals/trendDetection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: TrendFilters = {};
    
    if (searchParams.get('transportationMode')) {
      filters.transportationMode = searchParams.get('transportationMode')!;
    }
    
    if (searchParams.get('salesRep')) {
      filters.salesRep = searchParams.get('salesRep')!;
    }
    
    if (searchParams.get('dealSizeCategory')) {
      filters.dealSizeCategory = searchParams.get('dealSizeCategory')!;
    }
    
    if (searchParams.get('riskLevel')) {
      filters.riskLevel = searchParams.get('riskLevel')!;
    }
    
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')!;
    }
    
    if (searchParams.get('isStalling') !== null) {
      filters.isStalling = searchParams.get('isStalling') === 'true';
    }

    // Get deals from database
    const dealRepository = AppDataSource.getRepository(Deal);
    const deals = await dealRepository.find();

    // Analyze trends
    const { trends, insights } = analyzeDealTrends(deals, filters);

    return NextResponse.json({
      success: true,
      data: {
        trends,
        insights
      }
    });

  } catch (error) {
    console.error('Error in trends API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze deal trends' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: TrendFilters = body.filters || {};

    // Get deals from database
    const dealRepository = AppDataSource.getRepository(Deal);
    const deals = await dealRepository.find();

    // Analyze trends
    const { trends, insights } = analyzeDealTrends(deals, filters);

    return NextResponse.json({
      success: true,
      data: {
        trends,
        insights
      }
    });

  } catch (error) {
    console.error('Error in trends API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze deal trends' },
      { status: 500 }
    );
  }
} 