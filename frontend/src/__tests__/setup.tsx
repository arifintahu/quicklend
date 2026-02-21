import React from 'react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Helper to create a passthrough component for framer-motion
function createMotionComponent(tag: string) {
    const Component = React.forwardRef(function MotionComponent(props: Record<string, unknown>, ref: unknown) {
        const {
            initial, animate, exit, transition, variants,
            whileHover, whileTap, whileFocus, whileInView,
            layout, layoutId, onAnimationComplete,
            ...domProps
        } = props;
        return React.createElement(tag, { ...domProps, ref }, props.children as React.ReactNode);
    });
    Component.displayName = `motion.${tag}`;
    return Component;
}

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: new Proxy(
        {},
        {
            get: (_target, prop: string) => createMotionComponent(prop),
        }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => true,
}));

// Mock wagmi
vi.mock('wagmi', () => ({
    useAccount: vi.fn(() => ({
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        chain: { id: 31337, name: 'Localhost', blockExplorers: { default: { url: 'http://localhost' } } },
    })),
    useReadContract: vi.fn(() => ({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    })),
    useWriteContract: vi.fn(() => ({
        data: undefined,
        writeContract: vi.fn(),
        isPending: false,
        error: null,
        reset: vi.fn(),
    })),
    useWaitForTransactionReceipt: vi.fn(() => ({
        isLoading: false,
        isSuccess: false,
        error: null,
    })),
    useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
    useChainId: vi.fn(() => 31337),
    useConfig: vi.fn(() => ({})),
    WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(() => ({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        })),
        QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

// Mock @rainbow-me/rainbowkit
vi.mock('@rainbow-me/rainbowkit', () => ({
    ConnectButton: () => <button data-testid="connect-button">Connect Wallet</button>,
    RainbowKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    getDefaultConfig: vi.fn(() => ({})),
    useConnectModal: vi.fn(() => ({ openConnectModal: vi.fn() })),
    useAccountModal: vi.fn(() => ({ openAccountModal: vi.fn() })),
    useChainModal: vi.fn(() => ({ openChainModal: vi.fn() })),
}));

// Mock ToastContext globally so components don't need ToastProvider in tests
vi.mock('@/contexts/ToastContext', () => ({
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useToast: () => ({
        toasts: [],
        addToast: vi.fn(() => 'mock-toast-id'),
        removeToast: vi.fn(),
    }),
}));

// Suppress console.warn in tests
const originalWarn = console.warn;
beforeAll(() => {
    console.warn = (...args: unknown[]) => {
        if (typeof args[0] === 'string' && args[0].includes('Contract addresses not set')) return;
        originalWarn(...args);
    };
});

afterAll(() => {
    console.warn = originalWarn;
});
