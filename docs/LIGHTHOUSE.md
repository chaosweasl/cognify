# Lighthouse Performance Auditing Guide for Cognify

## What is Lighthouse?

Lighthouse is an open-source, automated tool built by Google for improving the quality of web pages. It runs audits for performance, accessibility, progressive web apps, SEO, and more. It's built into Chrome DevTools and can also be run from the command line or as a Node module.

## How to Run Lighthouse

### Method 1: Chrome DevTools (Recommended)

1. **Open Chrome DevTools**:

   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)
   - Right-click on the page and select "Inspect"

2. **Navigate to Lighthouse Tab**:

   - Look for the "Lighthouse" tab in DevTools
   - If you don't see it, click the `>>` arrows to find more tabs

3. **Configure the Audit**:

   - **Categories**: Select which audits to run:

     - ✅ Performance (most important for MVP)
     - ✅ Accessibility
     - ✅ Best Practices
     - ✅ SEO
     - ⚪ Progressive Web App (optional for MVP)

   - **Device**: Choose Desktop or Mobile (test both!)
   - **Throttling**: Select "Simulated Fast 3G" for realistic testing

4. **Run the Audit**:
   - Click "Generate report"
   - Wait for the audit to complete (30-60 seconds)

### Method 2: Chrome Extension (Alternative)

1. Install the Lighthouse Chrome Extension
2. Navigate to your page
3. Click the Lighthouse icon in the toolbar
4. Configure and run the audit

### Method 3: Command Line (Advanced)

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit on your local development server
lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html

# Run with specific flags
lighthouse http://localhost:3000 --only-categories=performance,accessibility --form-factor=mobile
```

## Key Areas to Focus On for Cognify MVP

### 1. Performance Metrics (Target Scores: 90+)

**Core Web Vitals**:

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms

**Common Issues & Fixes**:

#### Slow Loading Times

```typescript
// ❌ Bad: Loading all components at once
import { HeavyComponent } from "./HeavyComponent";
import { AnotherHeavyComponent } from "./AnotherHeavyComponent";

// ✅ Good: Lazy loading with dynamic imports
const HeavyComponent = lazy(() => import("./HeavyComponent"));
const AnotherHeavyComponent = lazy(() => import("./AnotherHeavyComponent"));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>;
```

#### Large Bundle Sizes

```typescript
// ❌ Bad: Importing entire libraries
import * as lodash from "lodash";
import { format, parse, addDays } from "date-fns";

// ✅ Good: Import only what you need
import { debounce } from "lodash/debounce";
import format from "date-fns/format";
```

#### Unoptimized Images

```tsx
// ❌ Bad: Regular img tags
<img src="/large-image.jpg" alt="Description" />

// ✅ Good: Next.js Image component
<Image
  src="/large-image.jpg"
  alt="Description"
  width={400}
  height={300}
  priority // For above-the-fold images
  placeholder="blur" // For better UX
/>
```

### 2. Accessibility (Target Score: 95+)

**Common Issues**:

- Missing alt text on images
- Poor color contrast
- Missing focus states
- Improper heading hierarchy
- Missing ARIA labels

**Quick Fixes**:

```tsx
// ❌ Bad accessibility
<button onClick={handleClick}>
  <IconOnly />
</button>

// ✅ Good accessibility
<button
  onClick={handleClick}
  aria-label="Save changes"
  className="focus:outline-none focus:ring-2 focus:ring-brand-primary"
>
  <Save className="w-4 h-4" />
  <span className="sr-only">Save changes</span>
</button>
```

### 3. Best Practices (Target Score: 95+)

- Use HTTPS in production
- Avoid console.log in production
- Proper error handling
- Security headers
- Modern JavaScript features

### 4. SEO (Target Score: 90+)

```tsx
// ✅ Good: Proper meta tags in Next.js
export const metadata: Metadata = {
  title: "Cognify - AI-Powered Learning Platform",
  description:
    "Transform your learning with AI-generated flashcards and spaced repetition",
  keywords: "learning, flashcards, AI, spaced repetition, education",
  openGraph: {
    title: "Cognify - AI-Powered Learning",
    description: "Transform your learning experience",
    images: ["/og-image.png"],
  },
};
```

## Cognify-Specific Performance Optimizations

### 1. Study Session Performance

```typescript
// ✅ Optimize SRS calculations
const useMemoizedSRSState = useMemo(() => {
  return calculatedHeavySRSState(cards, settings);
}, [cards, settings]); // Only recalculate when dependencies change

// ✅ Debounce frequent updates
const debouncedSave = useMemo(
  () => debounce((data) => saveSRSStates(data), 1000),
  []
);
```

### 2. AI Integration Performance

```typescript
// ✅ Stream AI responses for better perceived performance
const handleAIGeneration = async () => {
  const response = await fetch("/api/ai/generate-flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, stream: true }),
  });

  const reader = response.body?.getReader();
  // Process chunks as they arrive
};
```

### 3. Database Query Optimization

```typescript
// ✅ Batch database operations
const updateSRSBatch = async (states: SRSState[]) => {
  const batchSize = 50;
  const batches = chunk(states, batchSize);

  for (const batch of batches) {
    await supabase.from("srs_states").upsert(batch);
  }
};
```

## Running Regular Performance Audits

### Development Workflow

1. **Before Each Release**:

   ```bash
   # Build production version locally
   npm run build
   npm run start

   # Run Lighthouse audit
   lighthouse http://localhost:3000 --output=html --output-path=./reports/pre-release-audit.html
   ```

2. **CI/CD Integration** (Future):

   ```yaml
   # .github/workflows/lighthouse.yml
   name: Lighthouse CI
   on: [push]
   jobs:
     lighthouse:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Audit URLs using Lighthouse
           uses: treosh/lighthouse-ci-action@v7
           with:
             configPath: "./lighthouserc.js"
   ```

3. **Regular Monitoring**:
   - Weekly performance audits during development
   - Before and after major feature additions
   - When user feedback indicates performance issues

### Performance Budget

Set performance budgets to prevent regression:

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/projects",
        "http://localhost:3000/settings",
      ],
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
  },
};
```

## Interpreting Results

### Performance Score Breakdown

- **90-100**: Excellent (Green)
- **50-89**: Needs Improvement (Orange)
- **0-49**: Poor (Red)

### Priority Order for Fixes

1. **Red flags first**: Address any failing audits
2. **Core Web Vitals**: Focus on LCP, FID, CLS
3. **Opportunities**: Look at the "Opportunities" section for biggest impact
4. **Diagnostics**: Review diagnostics for additional insights

### Common Cognify Bottlenecks to Watch

1. **Large Flashcard Sets**: Monitor performance with 1000+ cards
2. **PDF Processing**: AI text extraction can be heavy
3. **Real-time Features**: Notifications and live updates
4. **Image Uploads**: Avatar and asset handling
5. **Complex SRS Calculations**: Mathematical operations on large datasets

## Tools Integration

### VS Code Extensions

- **Lighthouse**: Run audits directly in VS Code
- **Web Vitals**: Monitor Core Web Vitals
- **axe DevTools**: Additional accessibility testing

### Chrome DevTools Performance Tab

- Record runtime performance
- Analyze JavaScript execution
- Memory usage tracking
- Network request analysis

## Quick Checklist for MVP Release

- [ ] All pages score 90+ on Performance
- [ ] Accessibility score 95+
- [ ] Best Practices score 95+
- [ ] SEO score 90+
- [ ] No console errors in production build
- [ ] Images are optimized and properly sized
- [ ] JavaScript bundles are code-split appropriately
- [ ] Database queries are batched and optimized
- [ ] Loading states are implemented for all async operations
- [ ] Error boundaries are in place
- [ ] Security headers are configured
- [ ] HTTPS is enforced in production

## Useful Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Performance Best Practices](https://nextjs.org/docs/basic-features/built-in-css-support)
- [Supabase Performance Guide](https://supabase.com/docs/guides/platform/performance)

---

Remember: **Performance is a feature, not an afterthought.** Regular auditing ensures your users have the best possible experience with Cognify.
