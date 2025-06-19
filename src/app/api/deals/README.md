# Stalled Deals Endpoint

This endpoint provides real-time detection of stalled deals, assigns a simple risk score, and returns key deal details for sales leaders to prioritize their attention.

## Customer Problem
Sales leaders can’t track every single deal to ensure they’re on track. They need a way to quickly identify and prioritize deals that are stalling, so they can intervene and improve the chances of closing.

## Requirements
- **Trend Detection:** Identify deals that are stalling (no stage movement in 21+ days, default, configurable via query param).
- **Risk Scoring:** Assign a risk score based on how long a deal has been stalled.
- **Deal Details:** Return deal id, name, owner, stage, value, last stage change, days stalled, and risk score.

## API Flow
- **GET /api/deals?stalled=1[&stalled_days=XX]**
  - Scans all deals.
  - Calculates days since last stage movement.
  - Flags deals stalled for 21+ days.
  - Assigns a risk score (higher if stalled longer).
  - Returns a list of stalled deals with details and risk score.

## Example Response
```
[
  {
    "deal_id": "RV-001",
    "company_name": "Pacific Logistics Inc",
    "owner": "Mike Rodriguez",
    "stage": "proposal",
    "value": 45000,
    "last_stage_change": "2024-10-15T09:00:00Z",
    "days_stalled": 246,
    "risk_score": 2
  }
]
```

- The stalled threshold is configurable via the optional `stalled_days` query parameter (default: **21** days).
- Risk scoring is simple for MVP: 1 for stalled, 2 for severely stalled (2x threshold).
- Uses the existing deals data model and persistence.
