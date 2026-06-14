# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication and RBAC Flow >> should display login page if not authenticated
- Location: tests/e2e/auth.spec.ts:4:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication and RBAC Flow', () => {
  4  |   test('should display login page if not authenticated', async ({ page }) => {
  5  |     // Navigate to the dashboard
> 6  |     await page.goto('/dashboard');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  7  |     
  8  |     // Expect the page to redirect or show a connect wallet prompt
  9  |     // This is just a placeholder test
  10 |     await expect(page).toHaveTitle(/Bhumi/);
  11 |     
  12 |     // Example: verify a connect wallet button is visible
  13 |     // const connectBtn = page.getByRole('button', { name: /connect wallet/i });
  14 |     // await expect(connectBtn).toBeVisible();
  15 |   });
  16 | });
  17 | 
```