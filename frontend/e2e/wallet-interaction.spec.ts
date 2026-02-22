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
  // Two "Connect Wallet" buttons exist (Navbar + main content). Scope to the
  // header to avoid a strict-mode violation when both are in the DOM.
  await page.locator('header').getByRole('button', { name: /connect wallet/i }).click();

  // RainbowKit modal — click our E2E Wallet announced via EIP-6963
  // Try data-testid first (RainbowKit uses rdns as test id), then text fallback
  const wallet = page.locator('[data-testid="rk-wallet-option-com.e2e.wallet"]').or(
    page.locator('button').filter({ hasText: /e2e wallet/i })
  );
  await expect(wallet.first()).toBeVisible({ timeout: 5000 });
  await wallet.first().click();

  // After connecting, the Navbar shows the address in two places (subtitle + wallet
  // button). Scope to the header wallet button to avoid a strict-mode violation.
  await expect(
    page.locator('header').getByRole('button', { name: /0xf39F/ })
  ).toBeVisible({ timeout: 15000 });
}

/** Open the ActionCard modal for a given asset from the dashboard discovery tables */
async function openAssetModal(page: Page, symbol: string, mode: 'supply' | 'borrow' = 'supply'): Promise<void> {
  // Allow 20s because market data from Anvil can take ~13s to load in Docker,
  // and the discovery tables only render once markets are available.
  const btnName = mode === 'supply' ? /^Supply$/i : /^Borrow$/i;

  // Filter to the row that contains both the symbol text AND the target button.
  // Both supply and borrow tables have a row for the same symbol (e.g. USDC),
  // but only the correct table's row has the matching button.
  const row = page.locator('tr')
    .filter({ hasText: symbol })
    .filter({ has: page.getByRole('button', { name: btnName }) })
    .first();
  await expect(row).toBeVisible({ timeout: 20000 });
  await row.getByRole('button', { name: btnName }).click();

  // Wait for modal to open (identified by role=dialog)
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

test.describe('Wallet Connection', () => {
  test('connects wallet via E2E Wallet', async ({ walletPage }) => {
    await walletPage.goto('/');
    await connectWallet(walletPage);
  });

  test('disconnects wallet', async ({ walletPage }) => {
    await walletPage.goto('/');
    await connectWallet(walletPage);

    // Open wallet dropdown and disconnect (scope to header button to avoid
    // strict-mode violation with the subtitle text that also shows the address)
    await walletPage.locator('header').getByRole('button', { name: /0xf39F/ }).click();
    await walletPage.getByRole('button', { name: /disconnect/i }).click();

    await expect(
      walletPage.locator('header').getByRole('button', { name: /connect wallet/i })
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
    const modal = walletPage.getByRole('dialog');
    await expect(modal.locator('input[type="number"]')).toBeVisible();
  });

  test('supplies USDC tokens', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    const modal = walletPage.getByRole('dialog');

    // Wait for the wallet balance to load before interacting.
    // The Max label shows "$0.00" until useWalletBalance resolves.
    const maxLabel = modal.locator('span').filter({ hasText: 'Max:' });
    await expect(maxLabel).not.toContainText('$0.00', { timeout: 15000 });

    const amountInput = modal.locator('input[type="number"]');
    await amountInput.fill('100');

    // Step 1 — click the action button (may go to approve step first)
    const supplyButton = modal.getByRole('button', { name: /^Supply USDC/i });
    await expect(supplyButton).toBeEnabled();
    await supplyButton.click();

    // Step 2 — if approval is required, approve the token
    const approveButton = modal.getByRole('button', { name: /^Approve USDC/i });
    if (await approveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await approveButton.click();
      // Wait for the approval tx to confirm and advance to confirm step
      await expect(modal.getByRole('button', { name: /Confirm in Wallet/i })).toBeVisible({ timeout: 20000 });
    }

    // Step 3 — confirm the transaction
    await modal.getByRole('button', { name: /Confirm in Wallet/i }).click();

    // Modal should close after submission
    await expect(modal).toBeHidden({ timeout: 15000 });
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

  test('borrows USDC tokens', async ({ walletPage }) => {
    // Open borrow modal directly via the Borrow button in the discovery table
    await openAssetModal(walletPage, 'USDC', 'borrow');

    const modal = walletPage.getByRole('dialog');

    // Wait for borrow capacity to load before interacting.
    // The Max label shows "$0.00" until getUserData resolves and positions are available.
    const maxLabel = modal.locator('span').filter({ hasText: 'Max:' });
    await expect(maxLabel).not.toContainText('$0.00', { timeout: 15000 });

    const amountInput = modal.locator('input[type="number"]');
    await amountInput.fill('50');

    // Step 1 — click the action button (borrow skips approval, goes to confirm step)
    const borrowButton = modal.getByRole('button', { name: /^Borrow USDC/i });
    await expect(borrowButton).toBeEnabled();
    await borrowButton.click();

    // Step 2 — confirm the transaction
    await expect(modal.getByRole('button', { name: /Confirm in Wallet/i })).toBeVisible({ timeout: 5000 });
    await modal.getByRole('button', { name: /Confirm in Wallet/i }).click();

    // Modal should close after submission
    await expect(modal).toBeHidden({ timeout: 15000 });
  });
});

test.describe('ActionCard UI Features', () => {
  test.beforeEach(async ({ walletPage }) => {
    await walletPage.goto('/');
    await connectWallet(walletPage);
  });

  test('MAX button fills input with maximum amount', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    const modal = walletPage.getByRole('dialog');
    const amountInput = modal.locator('input[type="number"]');
    await expect(amountInput).toHaveValue('');

    // Wait for wallet balance to load before clicking MAX
    const maxLabel = modal.locator('span').filter({ hasText: 'Max:' });
    await expect(maxLabel).not.toContainText('$0.00', { timeout: 15000 });

    await modal.getByRole('button', { name: 'MAX' }).click();

    const value = await amountInput.inputValue();
    expect(value).not.toBe('');
    expect(parseFloat(value)).toBeGreaterThan(0);
  });

  test('health factor projection updates on amount input', async ({ walletPage }) => {
    await openAssetModal(walletPage, 'USDC');

    const modal = walletPage.getByRole('dialog');
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

    const modal = walletPage.getByRole('dialog');
    const supplyButton = modal.getByRole('button', { name: /^Supply USDC/i });
    await expect(supplyButton).toBeDisabled();
  });
});
