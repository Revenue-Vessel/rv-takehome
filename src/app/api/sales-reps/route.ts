import { NextRequest, NextResponse } from "next/server";
import { initializeDataSource } from "../../../data-source";
import { Deal } from "../../../lib/entities/deals/Deal";
import { SalesRep } from "../../../lib/entities/deals/SalesRep";

export async function GET() {
  try {
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const salesRepRepository = dataSource.getRepository(SalesRep);

    // Get all deals to count deals per sales rep
    const deals = await dealRepository.find();
    
    // Count deals per sales rep
    const salesRepCounts: Record<string, number> = {};
    deals.forEach(deal => {
      salesRepCounts[deal.sales_rep] = (salesRepCounts[deal.sales_rep] || 0) + 1;
    });

    // Get existing sales reps from database
    let salesReps = await salesRepRepository.find();

    // If no sales reps exist, create them from deals data
    if (salesReps.length === 0) {
      const uniqueSalesReps = [...new Set(deals.map(deal => deal.sales_rep))];
      
      // Mock data for territories and contact info
      const territories = ['CA', 'NY', 'TX', 'FL'];
      const mockData = {
        'Lisa Anderson': { phone: '(555) 123-4567', email: 'lisa.anderson@company.com', territory: 'CA' },
        'Jennifer Walsh': { phone: '(555) 234-5678', email: 'jennifer.walsh@company.com', territory: 'NY' },
        'Michael Chen': { phone: '(555) 345-6789', email: 'michael.chen@company.com', territory: 'TX' },
        'Sarah Johnson': { phone: '(555) 456-7890', email: 'sarah.johnson@company.com', territory: 'FL' },
        'David Smith': { phone: '(555) 567-8901', email: 'david.smith@company.com', territory: 'CA' },
        'Emily Davis': { phone: '(555) 678-9012', email: 'emily.davis@company.com', territory: 'NY' },
        'Robert Wilson': { phone: '(555) 789-0123', email: 'robert.wilson@company.com', territory: 'TX' },
        'Jessica Brown': { phone: '(555) 890-1234', email: 'jessica.brown@company.com', territory: 'FL' }
      };

      const salesRepEntities = uniqueSalesReps.map(salesRepName => {
        const nameParts = salesRepName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const mockInfo = mockData[salesRepName as keyof typeof mockData] || {
          phone: '(555) 000-0000',
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
          territory: territories[Math.floor(Math.random() * territories.length)]
        };

        return salesRepRepository.create({
          first_name: firstName,
          last_name: lastName,
          phone_number: mockInfo.phone,
          email: mockInfo.email,
          amount_of_deals: salesRepCounts[salesRepName] || 0,
          territory: mockInfo.territory
        });
      });

      salesReps = await salesRepRepository.save(salesRepEntities);
    } else {
      // Update existing sales reps with current deal counts
      for (const salesRep of salesReps) {
        const fullName = `${salesRep.first_name} ${salesRep.last_name}`;
        salesRep.amount_of_deals = salesRepCounts[fullName] || 0;
      }
      salesReps = await salesRepRepository.save(salesReps);
    }

    return NextResponse.json(salesReps);
  } catch (error) {
    console.error("Error fetching sales representatives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 