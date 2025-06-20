The following list decisions made that aren't directly listed as part of the exercise.

## Historical Analysis API
1. Added navigation menu to the home page to handle routing to new additions
2. Only included deals in closed won or closed lost status because we are focused on deals that have closed already.
3. Targeted expected_close_date for the date filtering based on the assumption it holds our closed date for closed deals.
4. Update the input text contrast globally as much for me because it was tough to see by default.

## Forecasting Algorithm
1. Added more seed data to 2025 and updated a couple 2024 numbers so that I could better test.
2. Retained filters from previous analytics but removed dates in favor of time chunking.
3. The Total Predicted Revenue was using unapplied filters to display the months shown. Updated to wait for applied filter.
4. Forecast Insights and Recommendations were all placeholders, so I used AI to come up with something a little more meaningful. This should be reviewed by the business to come up with our own assumptions.

## Trend Detection && Forecasting Dashboard
I saw that I was accomplishing some of this already as I looked ahead from the Forecasting Algorithm requirements section, so I am looping them into the remainder of that section.
