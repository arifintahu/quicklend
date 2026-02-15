import { test as base, type Page } from '@playwright/test';

/**
 * Mock EIP-1193 provider script injected into the browser via addInitScript().
 * - Returns test account #0 for eth_requestAccounts
 * - Proxies all RPC calls to Anvil (auto-signs for unlocked accounts)
 * - Announces via EIP-6963 as a generic injected wallet (NOT MetaMask)
 *
 * NOTE: We intentionally avoid rdns "io.metamask" because RainbowKit v2
 * routes that through the MetaMask SDK connector, which expects the real
 * MetaMask extension. Using a custom rdns triggers the standard injected
 * connector that simply calls eth_requestAccounts on our mock provider.
 */
function createMockProviderScript(rpcUrl: string) {
  return `
    (function () {
      const RPC_URL = ${JSON.stringify(rpcUrl)};
      const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const CHAIN_ID = '0x7a69'; // 31337

      const listeners = {};

      function emit(event, ...args) {
        if (listeners[event]) {
          listeners[event].forEach(fn => {
            try { fn(...args); } catch (e) { console.error('Provider event error:', e); }
          });
        }
      }

      async function rpcCall(method, params) {
        let res;
        try {
          res = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params: params || [] }),
          });
        } catch (networkError) {
          const err = new Error('Network error: ' + networkError.message);
          err.code = -32603;
          throw err;
        }
        if (!res.ok) {
          const err = new Error('HTTP ' + res.status + ': ' + res.statusText);
          err.code = -32603;
          throw err;
        }
        const json = await res.json();
        if (json.error) {
          const err = new Error(json.error.message || 'RPC error');
          err.code = json.error.code;
          throw err;
        }
        return json.result;
      }

      const provider = {
        // Do NOT set isMetaMask — avoids MetaMask SDK code path
        isMetaMask: false,
        _isConnected: false,
        selectedAddress: null,

        async request({ method, params }) {
          switch (method) {
            case 'eth_requestAccounts':
              provider._isConnected = true;
              provider.selectedAddress = TEST_ACCOUNT;
              emit('connect', { chainId: CHAIN_ID });
              emit('accountsChanged', [TEST_ACCOUNT]);
              return [TEST_ACCOUNT];

            case 'eth_accounts':
              return provider._isConnected ? [TEST_ACCOUNT] : [];

            case 'eth_chainId':
              return CHAIN_ID;

            case 'net_version':
              return '31337';

            case 'wallet_switchEthereumChain':
              emit('chainChanged', CHAIN_ID);
              return null;

            case 'wallet_addEthereumChain':
              return null;

            case 'eth_sendTransaction': {
              const tx = params[0];
              const fullTx = { ...tx, from: tx.from || TEST_ACCOUNT };
              return rpcCall('eth_sendTransaction', [fullTx]);
            }

            case 'personal_sign':
            case 'eth_sign':
            case 'eth_signTypedData_v4':
              // Dummy signature — bypasses wallet UI prompts.
              // Real signature validation is NOT tested by this mock.
              return '0x' + '00'.repeat(65);

            default:
              return rpcCall(method, params);
          }
        },

        on(event, fn) {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(fn);
          return provider;
        },

        removeListener(event, fn) {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter(f => f !== fn);
          }
          return provider;
        },

        removeAllListeners(event) {
          if (event) {
            delete listeners[event];
          } else {
            Object.keys(listeners).forEach(k => delete listeners[k]);
          }
          return provider;
        },

        emit: emit,
      };

      // Override window.ethereum before any dApp code runs
      Object.defineProperty(window, 'ethereum', {
        value: provider,
        writable: false,
        configurable: true,
      });

      const walletInfo = Object.freeze({
        info: {
          uuid: 'e2e-mock-wallet',
          name: 'E2E Wallet',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%2300C6FF"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">E</text></svg>',
          rdns: 'com.e2e.wallet',
        },
        provider: provider,
      });

      // Announce via EIP-6963 for RainbowKit discovery
      window.addEventListener('eip6963:requestProvider', () => {
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', { detail: walletInfo })
        );
      });

      // Also announce proactively
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', { detail: walletInfo })
      );
    })();
  `;
}

/** Determine the Anvil RPC URL based on environment */
function getAnvilRpcUrl(): string {
  // In Docker, E2E_BASE_URL is set — Anvil is at http://anvil:8545
  // Locally, use http://127.0.0.1:8545
  if (process.env.E2E_BASE_URL) {
    return 'http://anvil:8545';
  }
  return 'http://127.0.0.1:8545';
}

/**
 * Extended Playwright fixture that provides a `walletPage` with the mock
 * EIP-1193 provider pre-injected.
 */
export const test = base.extend<{ walletPage: Page }>({
  walletPage: async ({ page }, use) => {
    const rpcUrl = getAnvilRpcUrl();
    await page.addInitScript({ content: createMockProviderScript(rpcUrl) });
    await use(page);
  },
});

export { expect } from '@playwright/test';
