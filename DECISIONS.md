# Assumptions / Etc.

- That the `updated_date` of a deal is the last time it changed `stage`s
- I added additional deals based off of the existing ones, because 10 data points isn't super effective at creating predctions and forecasts. I had the AI create 90 additional deals for a nice round 100. I created `probability` ranges based off the `state`s on the "real" data so we'd get a good sense.
  - If `stage` is `closed_lost`, probability is 0
  - If `stage` is `closed_won`, probability is 100
  - If `stage` is `negotiation`, probability is between 80 and 95 inclusive
  - If `stage` is `proposal, probability is between 65 and 75 inclusive
  - if stage is qualified, probabiilty is between 50 and 60 inclusive
  - If stage is prospect, probability is between 10 and 45 inclusive
- In order to effectively forecast risk for stale deals, we need to know historical data (more specifically, for lost deals we need what stage the deal was in prior to loss, and the time spent in each stage). Without this, I based the risk calculation off of the probability of the deal, the time, and the value (higher deal amount, higher risk) but the historical data would give a much better sense of it.
- I created a risk score based off of the days since update, the amount of the deal (higher = more risk), and the probability of the deal (lower = more risk). Only stale deals will be at a risk higher than 0, so sales reps can focus their energy.

# AI

- As noted, I used the AI to generate additional test data
