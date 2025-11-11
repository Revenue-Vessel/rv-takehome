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
