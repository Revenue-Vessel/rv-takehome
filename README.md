# README

## Questions

### Which Milestone 1 path you chose and why

Chose Territory Management System since it seemed more straightforward to me.

### Which Milestone 2 specialization you pursued

N/A

### **AI Collaboration Report:** Specific examples of AI-generated code you improved

```javascript
// src/lib/territory.ts (BEFORE)

export const stateToTerritory = {
  CA: "West Coast",
  WA: "West Coast",
  OR: "West Coast",
  // ... (rest)
};

export function getStateFromCity(cityStr) {
  const match = cityStr.match(/,\s*([A-Z]{2})$/);
  return match ? match[1] : null;
}

export function getTerritory(origin_city) {
  const state = getStateFromCity(origin_city);
  return state ? stateToTerritory[state] || "Other" : "Other";
}
```

- Fixed type errors with `stateToTerritory[state]`
- Add types for input and outputs
- Fix regex to get state abbreviation

```javascript
// src\components\DealList.tsx (BEFORE)

const allDeals = useMemo(() => {
  if (!pipelineData) return [];

  const deals: DealWithTerritory[] = [];
  Object.values(pipelineData.stageAnalytics).forEach((stageData) => {
    deals.push(
      ...stageData.deals.map((deal) => ({
        ...deal,
        territory: getTerritory(deal.origin_city),
      }))
    );
  });
  return deals;
}, [pipelineData]);
```

- Refactor nesting for readability

```javascript
// src\components\DealList.tsx (BEFORE)

<select
  value={editedReps[deal.deal_id] ?? deal.sales_rep}
  onChange={(e) => {
    const newRep = e.target.value;
    setEditedReps((prev) => {
      // User put it back to the original rep → remove from edits
      if (newRep === deal.sales_rep) {
        const copy = { ...prev };
        delete copy[deal.deal_id];
        return copy;
      }
      // Otherwise, track the edit
      return { ...prev, [deal.deal_id]: newRep };
    });
  }}
>
  {uniqueSalesReps.map((rep) => (
    <option value={rep} key={rep}>
      {rep}
    </option>
  ))}
</select>
```

- Fix bug where current sales rep would show in dropdown (should not allow reassignment to self)

```javascript
// src\components\DealList.tsx (BEFORE)

async function handleSaveAllDeals() {
  // Only save for reassigned sales reps
  const updatedDeals = allDeals
    .filter(
      (deal) =>
        editedReps[deal.deal_id] && editedReps[deal.deal_id] !== deal.sales_rep
    )
    .map((deal) => ({
      ...deal,
      sales_rep: editedReps[deal.deal_id],
    }));

  if (updatedDeals.length === 0) return;

  const response = await fetch("/api/deals", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedDeals),
  });

  if (response.ok) {
    setEditedReps({});
  }
  // handle errors
}
```

- Update filter since we cannot select the same rep
- Show error toast if update fails
- Show success toast if update successful
- Refresh table via `fetchDeals()` on update success

### **Technical Decisions:** Architecture choices and trade-offs made

- Leverage existing table to create reassignment column for sales reps
- Borrow layout from `PipelineFunnel` to create vertical bar chart for `TerritoryBarChart`

Trade-offs: less work with consistent layout but also less unique components, OK for prototype IMO.

### **Demo Guide:** How to see your best features in action

- View `TerritoryBarChart` for territory metrics
- Select from table column `Reassign` dropdown when reassigning sales rep and hit `Save All Reassignments`

### What you'd prioritize next with more time

Adding more tests and fixing the test errors, with initial repo cloning changes saw some errors related to:

- `Error in POST /api/deals: Error: Database connection failed`
- `Error in POST /api/deals: Error: Invalid JSON`
- `Error fetching deals by stage: Error: Database error`

Even though the results were 48/48 tests passing 🤔.
