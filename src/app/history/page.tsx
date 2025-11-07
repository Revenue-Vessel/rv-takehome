import HistoricalAnalysis from "../../components/HistoricalAnalysis";
export default function HistoryPage() {
  return (
    <div>
      <h1>Historical Analysis</h1>
      <br/>
      <HistoricalAnalysis grouping="mode"/>
      <br/>
     <HistoricalAnalysis grouping="rep"/>
     <br/>
     <HistoricalAnalysis grouping="size"/>
    </div>
  );
}
