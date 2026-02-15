import { test, expect } from '@playwright/test';

test.describe('Page Navigation', () => {
    test('dashboard page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/QuickLend/i);
    });

    test('dashboard shows Protocol Health section', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Protocol Health')).toBeVisible();
    });

    test('dashboard shows Core Assets section', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Core Assets')).toBeVisible();
    });

    test('dashboard shows Net APY card', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Net APY')).toBeVisible();
    });

    test('dashboard shows Collateral and Debt cards', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('div').filter({ hasText: /^Collateral$/ })).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Debt$/ })).toBeVisible();
    });

    test('navigates to portfolio page', async ({ page }) => {
        await page.goto('/portfolio');
        await expect(page.getByText('Net Worth')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Supplied Assets' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Borrowed Assets' })).toBeVisible();
    });

    test('portfolio shows Coming Soon for rewards', async ({ page }) => {
        await page.goto('/portfolio');
        await expect(page.getByText('Coming Soon')).toBeVisible();
    });

    test('portfolio shows empty states without wallet', async ({ page }) => {
        await page.goto('/portfolio');
        await expect(page.getByText('No supplied assets')).toBeVisible();
        await expect(page.getByText('No borrowed assets')).toBeVisible();
    });

    test('navigates to markets page', async ({ page }) => {
        await page.goto('/markets');
        await expect(page.getByText('Total Market Size')).toBeVisible();
        await expect(page.getByText('Total Available')).toBeVisible();
        await expect(page.getByText('Total Borrows')).toBeVisible();
    });

    test('markets page has search functionality', async ({ page }) => {
        await page.goto('/markets');
        const searchInput = page.getByPlaceholder('Search assets...');
        await expect(searchInput).toBeVisible();
    });

    test('navigates to history page', async ({ page }) => {
        await page.goto('/history');
        // Should show empty state since no wallet is connected
        await expect(page.getByText('No transactions yet')).toBeVisible();
    });

    test('history empty state shows helper text', async ({ page }) => {
        await page.goto('/history');
        await expect(page.getByText('Your transaction history will appear here')).toBeVisible();
    });
});

test.describe('Sidebar Navigation', () => {
    test('sidebar is visible on desktop', async ({ page }) => {
        await page.goto('/');
        // Sidebar should contain navigation links
        const sidebar = page.locator('aside, nav').first();
        await expect(sidebar).toBeVisible();
    });

    test('can navigate between pages using sidebar links', async ({ page }) => {
        await page.goto('/');

        // Click Portfolio link if available
        const portfolioLink = page.getByRole('link', { name: /portfolio/i });
        if (await portfolioLink.isVisible()) {
            await portfolioLink.click();
            await expect(page).toHaveURL(/portfolio/);
            await expect(page.getByText('Net Worth')).toBeVisible();
        }
    });
});

test.describe('Responsive Layout', () => {
    test('renders correctly on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.getByText('Protocol Health')).toBeVisible();
    });

    test('renders correctly on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');
        await expect(page.getByText('Protocol Health')).toBeVisible();
    });
});
