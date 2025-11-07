import { NextRequest, NextResponse } from "next/server";
import { Deal } from "../../../lib/entities/deals/Deal";
import { initializeDataSource } from "../../../data-source";

export async function GET(request) {
  try {
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const group = request.nextUrl.searchParams.get('group');
    let query = dealRepository.
	createQueryBuilder("deal").
	select("COUNT(deal.id) as total").
	addSelect("SUM(CASE WHEN deal.stage = :won THEN 1 ELSE 0 END) as wins").
        where("deal.stage = :won OR deal.stage = :lost").
	setParameters({won: "closed_won",
		       lost: "closed_lost"});
    if (group == "mode") {
      query = query.
	addSelect("deal.transportation_mode as mode").
	groupBy("deal.transportation_mode")
    };
    if (group == "rep") {
      query = query.
	addSelect("deal.sales_rep as rep").
	groupBy("deal.sales_rep")
    }
    if (group == "size") {
      query = query.
	addSelect("deal.size").
	from((subQuery)=>{
	  return subQuery.
	    select("deal.id").
	    addSelect("deal.stage").
	    addSelect("CASE WHEN deal.value < 20000 THEN 'small' " +
		      "WHEN deal.value < 60000 THEN 'medium' " +
		      "ELSE 'large' END as size").
	    from(Deal, "deal")
	}, "deal").
	groupBy("size");
    }
    const stats = await query.getRawMany()
    console.log(stats);
    return NextResponse.json({
      stats
    });
  } catch (error) {
    console.error("Error fetching deals by stage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  };
};
