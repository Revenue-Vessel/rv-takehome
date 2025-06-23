# Decisions

Territory Management System

## Customer Requirements

- Assign accounts to my various reps so they don’t compete for the same deals
- Break accounts down into territories
- Assign deals to people
- Quickly see how many deals are assigned to which territory to make sure deals are balanced
- Track performance across territories

## Components

**Required Components:**

- ✅ **Geographic Intelligence:** Parse and standardize city/state data, group into territories
- **Performance Comparison:** Compare sales performance across territories ~~with drilling down capabilities~~
- ✅ **Territory Assignment:** Allow reassigning deals between sales reps ~~with proper audit trails~~
- **Interactive Territory Dashboard:**
  - ~~Map-like~~ interface showing performance by region (can be table-based if mapping is complex)
  - Territory comparison tools with filters and sorting
  - ~~Rep workload balancing insights~~
  - ~~Territory performance trends~~

**Down-scope Reasoning:** the items with strike-through were either too vague (requires more product/technical refinement) or mostly didn't seem to be critical for a prototype or MVP based on what the customer requirements are above.

We are making an assumption that territory is based on origin city.

**Product Depth Requirements:**

- Thoughtful UX for managing complex territory data
- Bulk operations for deal reassignment
- Comprehensive filtering and search across territories
- Responsive design that works well on different screen sizes
- Clear data visualization of territory performance
