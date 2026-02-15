import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/history');
    });

    test('shows empty state without wallet connection', async ({ page }) => {
        await expect(page.getByText('No transactions yet')).toBeVisible();
    });

    test('shows helper text in empty state', async ({ page }) => {
        await expect(page.getByText('Your transaction history will appear here')).toBeVisible();
    });

    test('does not show table headers in empty state', async ({ page }) => {
        // Table headers should not be visible when there's no data
        await expect(page.getByRole('columnheader', { name: 'Action' })).not.toBeVisible();
    });

    test('does not show pagination in empty state', async ({ page }) => {
        await expect(page.getByText('Previous')).not.toBeVisible();
        await expect(page.getByText('Next')).not.toBeVisible();
    });

    test('page layout renders correctly', async ({ page }) => {
        // Main content area should be visible
        const main = page.locator('main');
        await expect(main).toBeVisible();
    });
});
