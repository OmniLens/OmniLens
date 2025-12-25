# 👁️ OmniLens

<a href="https://vercel.com/blog/vercel-open-source-program-fall-2025-cohort#omnilens">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>
<br />
<br />

An intelligent dashboard that transforms GitHub Actions chaos into actionable insights. OmniLens gives you complete visibility into your CI/CD pipeline health, helping you identify bottlenecks, track success rates, and optimize your development workflow. Just connect your repositories and instantly see which workflows are failing, when they're running, and how they're performing over time.

[Our documentation can be found here, powered by Mintlify 💚](https://omnilens-626cb878.mintlify.app/home)

## ✨ Features

- **Repository Management**: Add, validate, and remove GitHub repositories from dashboard
- **Workflow History**: View GitHub Actions workflow runs for specific dates
- **Metrics & Analytics**: Track success rates, pass/fail counts, runtime calculations, and workflow performance over time

## 🏗️ Architecture

- **Bun**: Package manager and runtime
- **Next.js 16**: App router with React Server Components
- **PostgreSQL**: Database for repository and workflow persistence
- **Tailwind CSS**: Styling with shadcn/ui components
- **TypeScript**: Full type safety throughout
- **Zod**: Runtime type validation and schema validation

## 📊 Data Source

The dashboard uses the `GitHub Actions API` to fetch workflow runs, repository info, and workflow definitions.
