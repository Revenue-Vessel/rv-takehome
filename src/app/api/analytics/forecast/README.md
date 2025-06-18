# Forecast API Endpoint

This folder contains the API route for forecasting monthly revenue for the sales pipeline.

## Why a Separate File?
- **Separation of Concerns:** Forecasting is an advanced analytics feature, distinct from basic deal CRUD and analytics. Keeping it in its own folder (`/api/analytics/forecast/`) keeps the codebase organized and endpoints clear.
- **Scalability:** As more analytics features (e.g., win rates, trends, risk scoring) are added, grouping them under `/api/analytics/` makes the project modular and easier to maintain.
- **RESTful Design:** Grouping analytics endpoints separately from core resource endpoints is a best practice for clarity and maintainability.

# Forecast API – Logic & Edge Cases

This API returns monthly revenue forecasts from now until the end of the next quarter. Each month includes a `quarter` key for easy grouping in the UI.

## Forecast Logic
- For each open deal, forecasted revenue is: `value * (probability / 100) * win_rate`.
- `win_rate` is the historical win rate for the deal's transportation mode, based on closed deals. If no history, win rate defaults to 1.
- All months in the range are included, even if they have no deals (showing zero revenue).

## Cases Handled
- No deals in range: All months are included with zero revenue and a helpful message.
- Some months have deals, some don't: All months are shown; months with no deals have zero revenue.
- Partial data: Deals missing `expected_close_date`, `value`, or `probability` are skipped.

## Future Enhancements
- Support custom forecast ranges via query parameters (e.g., `?months=6`).
- Add filters (e.g., by sales rep, mode, or stage) for more granular forecasting.
