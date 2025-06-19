## DECISIONS.md

### What I chose to build first

* Forecasting monthly revenue — because the sales leader really needs to know if the quarter is on track. If the sales leader can be sure that the quarter is good, then they can spend their effort on other things. This felt like the biggest priority and the most valuable insight, based on the problem statement.
* Detecting stalled deals — it’s simple but super useful for prioritizing which deals need attention now.
* Analyzing team performance — important for coaching, but a bit more complex, so I put it after the other two.

### What I deprioritize for now

* The full dashboard UI — it’s really important, but given the time and my background, I deprioritized it and focused on getting solid data ready first. Leaders can start using the raw data while the UI gets built out later.

### Assumptions I made

* Sales leaders want quick, actionable insights to guide where to focus effort.
* Deals that haven’t moved in 21+ days are considered stalled.
* Forecasting doesn’t need fancy ML, just solid, understandable math.

### Tradeoffs

* Prioritized backend logic and accuracy over frontend polish.
* Keeping forecasting simple to deliver something reliable in the time limit.

### Next Steps

* If time permits, I’ll start building out the dashboard UI and visualizations.

---

### Trend Detection: Stalled Deals with Risk Scoring — Decisions & Assumptions

- **Risk Scoring Approach:**  
  I’m using only "days stalled" (number of days since last stage movement) for risk scoring.  
  Risk score is 1 if stalled for more than 21 days, and increases by 1 for every additional 14 days (2 weeks) the deal remains stalled.  
  Assumption: Simplicity is best for the first version; I can always add more factors later if needed.

- **Processing Timing:**  
  I’m focusing on real-time visual indicators in the dashboard for now, not any background or batch processing.  
  Assumption: Visual cues are enough for the MVP, and more advanced processing can come later.

- **Configurability:**  
  I’m using a default threshold of 21 days for "stalled" status, with plans to make this configurable in the future.  
  Assumption: 21 days feels like a reasonable starting point based on typical sales cycles.

- **Action Tracking:**  
  I’m not tracking actions taken on flagged deals in this phase.  
  Assumption: The main goal right now is visibility, not workflow or audit, for the MVP.
