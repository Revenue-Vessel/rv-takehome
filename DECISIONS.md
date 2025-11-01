## DECISIONS.md

### What I chose to build first

* Forecasting monthly revenue — because the sales leader really needs to know if the quarter is on track. If the sales leader can be sure that the quarter is good, then they can spend their effort on other things. This felt like the biggest priority and the most valuable insight, based on the problem statement.
* Detecting stalled deals — it’s simple but super useful for prioritizing which deals need attention now.
* Analyzing team performance — important for coaching, but a bit more complex, so I put it after the other two.

### What I deprioritize for now

* The full dashboard UI — it’s really important, but given the time and my background, I deprioritized it and focused on getting solid data ready first. Leaders can start using the raw data in a much simpler UI while the more intuitive UI gets built out later.

### Assumptions I made

* Sales leaders want quick, actionable insights to guide where to focus effort.
* Deals that haven’t moved in 21+ days are considered stalled.
* Forecasting doesn’t need fancy ML, just solid, understandable math.

### Tradeoffs

* Prioritized backend logic and accuracy over frontend polish.
* Keeping forecasting simple to deliver something reliable in the time limit.

### Next Steps

* If time permits, I’ll start building out the dashboard UI and visualizations.

### Forecasting Monthly Revenue

#### Historical Patterns in Forecasting

**Approach:**  
- I chose to incorporate **historical win rate by segment (transportation mode)** into the forecasting algorithm.

**Why transportation mode?**  
- Transportation mode is a core dimension in logistics and is always present in the data, making it a reliable segment for analysis.
- Win rates can vary significantly between modes (e.g., ocean vs. air), so this segmentation can provide meaningful adjustments to the forecast.
- Other segments (like sales rep or deal size) could be used, but it is more volatile. This approach is easy to extend in the future if needed.

**Why this approach?**  
- It’s simple, explainable, and fits well with our current data model.
- It allows me to adjust forecasts based on how successful we've been with similar deals in the past, making predictions more realistic than just using pipeline probability alone.

**How does it work?**  
- For each open deal, I multiply its value by its probability and by the historical win rate for its transportation mode.
- Win rate is calculated as:
`win_rate = closed_won / (closed_won + closed_lost)`
- If all deals in a segment were won, win rate = 1.
- If no deals were won, win rate = 0.
- If there is no history, win rate to defaults to 1.

**Pros:**  
- Easy to implement and understand.
- Makes use of available data without requiring complex analytics or ML.
- Can be extended to other segments (e.g., sales rep, deal size) in the future.

**Cons:**  
- If there is little or no historical data for a segment, the adjustment may be inaccurate or default to 1.
- Does not account for seasonality, trends, or other external factors.
- Assumes the future will behave like the past.
