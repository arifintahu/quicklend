import { type Page } from '@playwright/test';
import { test, expect } from './fixtures/wallet';

const ANVIL_RPC = process.env.E2E_BASE_URL ? 'http://anvil:8545' : 'http://127.0.0.1:8545';

/** Snapshot ID for Anvil state reset between tests */
let snapshotId: string | null = null;

/** Take Anvil EVM snapshot for test isolation */
async function takeSnapshot(): Promise<string> {
  const res = await fetch(ANVIL_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'evm_snapshot', params: [] }),
  });
  const json = await res.json();
  return json.result;
}

/** Revert Anvil to a previous snapshot */
async function revertSnapshot(id: string): Promise<void> {
  await fetch(ANVIL_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'evm_revert', params: [id] }),
  });
}

/** Connect wallet via mock EIP-6963 wallet in RainbowKit modal */
async function connectWallet(page: Page): Promise<void> {
  await page.getByRole('button', { name: /connect wallet/i }).click();

  // RainbowKit modal — click our E2E Wallet announced via EIP-6963
  // Try data-testid first (RainbowKit uses rdns as test id), then text fallback
  const wallet = page.locator('[data-testid="rk-wallet-option-com.e2e.wallet"]').or(
    page.locator('button').filter({ hasText: /e2e wallet/i })
  );
  await wallet.first().click();

  await expect(page.getByText(/0xf39F.*2266/)).toBeVisible({ timeout: 15000 });
}

/** Open the ActionCard modal for a given asset from the dashboard */
async function openAssetModal(page: Page, symbol: string): Promise<void> {
  const row = page.locator('tr').filter({ hasText: symbol });
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.getByRole('button', { name: 'Details' }).click();
  await expect(page.getByRole('heading', { name: symbol })).toBeVisible();
}

test.describe('Wallet Connection', () => {
  test('connects wallet via E2E Wallet', async ({ walletPage }) => {
    await walletPage.goto('/');
    await connectWallet(walletPage);
  });

  test('disconnects wallet', async ({ walletPage }) => {
    await walletPage.goto('/');
    await connectWallet(walletPage);

    // Open wallet dropdown and disconnect
    await walletPage.getByText(/0xf39F.*2266/).click();
    await walletPage.getByRole('button', { name: /disconnect/i }).click();

    await expect(
      walletPage.getByRole('button', { name: /connect wallet/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Supply Flow', () => {
  test.beforeEach(async ({ walletPage }) => {
    try { snapshotId = await takeSnapshot(); } catch { /* Anvil may not be running */ }
    await walletPage.goto('/');
    await connectWallet(walletPage);
  });

  test.afterEach(async () => {
    if (snapshotId) {
      try { await revertSnapshot(snapshotId); } catch { /* ignore */ }
      snapshotId = null;
    }
  });

  test('opens supply modal for USDC', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');
    await expect(walletPage.locator('input[type="number"]')).toBeVisible();
  });

  test('supplies USDC tokens', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    const amountInput = walletPage.locator('input[type="number"]');
    await amountInput.fill('100');

    const supplyButton = walletPage.getByRole('button', { name: /^Supply USDC/i });
    await expect(supplyButton).toBeEnabled();
    await supplyButton.click();

    // Modal should close after submission (tx was sent)
    await expect(walletPage.locator('.fixed.inset-0.z-50')).toBeHidden({ timeout: 15000 });
  });
});

test.describe('Borrow Flow', () => {
  test.beforeEach(async ({ walletPage }) => {
    try { snapshotId = await takeSnapshot(); } catch { /* Anvil may not be running */ }
    await walletPage.goto('/');
    await connectWallet(walletPage);
  });

  test.afterEach(async () => {
    if (snapshotId) {
      try { await revertSnapshot(snapshotId); } catch { /* ignore */ }
      snapshotId = null;
    }
  });

  test('switches to borrow tab and borrows USDC', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    // Switch to Borrow tab
    await walletPage.getByRole('button', { name: 'Borrow' }).click();

    const amountInput = walletPage.locator('input[type="number"]');
    await amountInput.fill('50');

    const borrowButton = walletPage.getByRole('button', { name: /^Borrow USDC/i });
    await expect(borrowButton).toBeEnabled();
    await borrowButton.click();

    // Modal should close after submission
    await expect(walletPage.locator('.fixed.inset-0.z-50')).toBeHidden({ timeout: 15000 });
  });
});

test.describe('ActionCard UI Features', () => {
  test.beforeEach(async ({ walletPage }) => {
    await walletPage.goto('/');
    await connectWallet(walletPage);
  });

  test('MAX button fills input with maximum amount', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    const amountInput = walletPage.locator('input[type="number"]');
    await expect(amountInput).toHaveValue('');

    await walletPage.getByRole('button', { name: 'MAX' }).click();

    const value = await amountInput.inputValue();
    expect(value).not.toBe('');
    expect(parseFloat(value)).toBeGreaterThan(0);
  });

  test('health factor projection updates on amount input', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    // Scope to the modal overlay to avoid matching dashboard "Health Factor" labels
    const modal = walletPage.locator('.fixed.inset-0.z-50');
    await expect(modal.getByText('Health Factor')).toBeVisible();

    const amountInput = modal.locator('input[type="number"]');
    await amountInput.fill('100');

    // The projected health factor arrow (ArrowRight SVG) should appear
    const healthFactorRow = modal.locator('div').filter({ hasText: 'Health Factor' });
    const arrowIcon = healthFactorRow.locator('svg');
    await expect(arrowIcon.first()).toBeVisible({ timeout: 5000 });
  });

  test('supply button is disabled when amount is empty', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    const supplyButton = walletPage.getByRole('button', { name: /^Supply USDC/i });
    await expect(supplyButton).toBeDisabled();
  });
});
