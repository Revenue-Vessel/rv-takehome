This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




## Jacob's Notes

1. The instructions stated to seed the data using a call to port 3001, however the default port is 3000 so it errored out. I updated the call to use port 3000 which re-seeded the data.

### Chosen Milestone Path

I chose Option A. I believe that given the growth trajectory of the software, this seems like the logical next step to me. We have given users the data they need to source potential deals and they likely are already working them. Although managing their people is important to keep them from dipping into each other's pool (such as Option B), the benefits derived from organization are not as easily realized as the benefits derived from optimizing wins. Business revenue means money to spend on our software.

### AI Collab

#### Historical Analysis API
1. Use filter button versus on change to prevent unnecessary API calls (scale thing), also annoying for text fields (although could implement debounce method if wanted on change results instead).
2. Add navigation bar for ease of navigation instead of typing url route.
3. Remove Active Filters section that showed redundant information.
4. Deal Size filter was not properly matching deals with the size buckets introduced, so we added that
5. Added test for deal size filtering so it is not re-introduced.
6. Show values used for deal sizing.
7. Used the proposed problem and background of the data to have AI come up with some defaults for data insights (see generateInsights in historical-analytics.ts)

#### Forecasting Algorithm
1. The seasonality numbers need to be updated to fit the industry for us, but this is a good formula based on our limited historical starting data.
2. I added line graph with rechart because sales and ops folks love em. Obviously it is also just easier to see trends that way.
3. Had to fix some of the styling because the contrast initially kept some of it from being properly viewed.

#### Trend Detection
1. The imports for the data routes came through incorrect on first pass. I updated them to match the correct routes.
2. The filters diverged suddenly from the previous page structure. They were over engineered with added complexity that created rendering issues when changing from one non null filter set to the next. I reverted the logic and pulled from prior page filters to match UX and fix over-complexity.

#### Forecasting Dashboard
1. I built a lot of this in with the Forecasting Algorithm but didnt get to all the specifics due to time.

### To demo this
Just run the app as you originally instructed

### Demo Video
A screenshare demo video is available showing the application in action. The demo covers:
- Historical Analysis with filtering capabilities
- Revenue Forecasting with interactive charts
- Trend Detection for identifying stalling deals
- Navigation between different dashboard views

The demo video file (`screenshare-demo.mov`) is included in this repository.

### With more time
1. I would like to do some further code review on the last two features I added. The first set I reviewed very meticulously, but did not want to get stuck for too long there.
2. I would certainly like to get into some of the later asks.