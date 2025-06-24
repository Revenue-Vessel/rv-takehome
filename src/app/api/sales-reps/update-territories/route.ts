import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from 'typeorm';
import { SalesRep } from '../../../../lib/entities/deals/SalesRep';

export async function PUT(request: NextRequest) {
  try {
    const { salesRepIds, newTerritory } = await request.json();

    if (!salesRepIds || !Array.isArray(salesRepIds) || salesRepIds.length === 0) {
      return NextResponse.json(
        { error: 'salesRepIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!newTerritory || typeof newTerritory !== 'string') {
      return NextResponse.json(
        { error: 'newTerritory is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate territory
    const validTerritories = ['CA', 'NY', 'TX', 'FL'];
    if (!validTerritories.includes(newTerritory)) {
      return NextResponse.json(
        { error: 'newTerritory must be one of: CA, NY, TX, FL' },
        { status: 400 }
      );
    }

    const salesRepRepository = getRepository(SalesRep);

    // Update all sales reps with the new territory
    await salesRepRepository
      .createQueryBuilder()
      .update(SalesRep)
      .set({ territory: newTerritory })
      .whereInIds(salesRepIds)
      .execute();

    // Fetch updated sales reps to return
    const updatedSalesReps = await salesRepRepository.findByIds(salesRepIds);

    return NextResponse.json({
      message: `Successfully updated ${updatedSalesReps.length} sales representatives to territory ${newTerritory}`,
      updatedSalesReps
    });

  } catch (error) {
    console.error('Error updating sales rep territories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 