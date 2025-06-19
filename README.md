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

---

# Project Milestones & Specializations

A. Path Chosen
I chose Option A because backend development and data analytics are my strengths. This path gave me the opportunity to build solid, reliable APIs and focus on meaningful insights before layering on more advanced logic.

B. Specialization Chosen
I focused on two areas, in the order I felt would deliver the most value to a sales leader:

Forecasting monthly revenue — because knowing whether the quarter is on track is critical. If the sales leader can trust the forecast, they can shift their energy to strategy instead of chasing updates. This felt like the highest priority based on the problem statement.

Detecting stalled deals — it’s a simple signal, but incredibly helpful for quickly spotting which deals need attention right now. It supports proactive intervention with minimal effort.

I wanted to also address analyzing team performance but I was short on time 

## C. AI Collaboration Report

### Code Rewritten For:
- **Edge Case Handling:** Skipped deals missing `expected_close_date`, `value`, or `probability` in forecasting.
- **DB Optimization:** Batched DB queries for win rate calculation instead of per-deal queries.
- **Test Logic AI Didn't Suggest:** Added tests for months with no deals and for deals with missing fields.
- **Fixed Failing tests on deals:** Fixed some failing tests on deals.

## D. Technical Decisions

- **Backend vs Client Processing:** Heavy analytics (forecasting, risk scoring) are done server-side for performance and security. UI filtering/sorting is client-side for responsiveness.
- **Tradeoffs:**
  - Server-side analytics ensure data consistency and scalability, but add some latency.
  - Client-side filtering is fast for small datasets, but would move to server for large data.

## E. Demo
pushed to `demo-images` directory

## F. Feature specific work flows and thought processes are captured in their respective folder's `README.md`

