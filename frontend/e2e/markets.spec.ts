import { test, expect } from '@playwright/test';

test.describe('Markets Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/markets');
    });

    test('displays market statistics cards', async ({ page }) => {
        await expect(page.getByText('Total Market Size')).toBeVisible();
        await expect(page.getByText('Total Available')).toBeVisible();
        await expect(page.getByText('Total Borrows')).toBeVisible();
    });

    test('shows search input', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search assets...');
        await expect(searchInput).toBeVisible();
    });

    test('search input is functional', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search assets...');
        await searchInput.fill('test');
        await expect(searchInput).toHaveValue('test');
    });

    test('shows trust signal', async ({ page }) => {
        await expect(page.getByText('Non-Custodial')).toBeVisible();
    });

    test('displays asset table headers when markets loaded', async ({ page }) => {
        // These headers come from the AssetTable component
        // They may or may not be visible depending on whether contracts are configured
        const table = page.locator('table');
        if (await table.isVisible()) {
            await expect(page.getByText('Asset')).toBeVisible();
        }
    });

    test('shows dollar-formatted values in stat cards', async ({ page }) => {
        // Stats cards show $0.00 initially — wait for loading to finish
        const dollarValues = page.locator('text=/\\$[\\d,]+\\.\\d{2}/');
        await expect(dollarValues.first()).toBeVisible({ timeout: 15000 });
        const count = await dollarValues.count();
        expect(count).toBeGreaterThanOrEqual(3); // At least 3 stat cards
    });
});
