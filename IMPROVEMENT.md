# QuickLend UX Review & Improvement Plan

> **Review Date:** 2026-02-21
> **Scope:** Product UI/UX audit against QuickLend's vision of seamless lending interaction accessible to new crypto users
> **Methodology:** Full codebase review of frontend/, landing-page/, backend/, smart-contract/, and all documentation

---

## Executive Summary

QuickLend's vision is to provide the best UI/UX for supplying and borrowing tokens -- so intuitive that even first-time crypto users can navigate it confidently. The current implementation demonstrates strong visual design foundations: a polished glassmorphism aesthetic, the innovative Health Dial, real-time projected Health Factor preview, transaction lifecycle toasts, and a well-structured component architecture.

A previous review cycle addressed several critical bugs (withdraw/repay action mapping, hardcoded liquidation prices, history page showing raw addresses) and added important UX features (tooltips, WelcomeModal, toast notifications, landing page). These improvements have moved the product forward significantly.

However, this fresh review reveals **new critical gaps** that were not previously identified -- most notably a broken token approval flow that blocks all first-time supply attempts, missing confirmation steps before irreversible transactions, and absent error recovery mechanisms. The product still caters more to users who already understand DeFi than to the newcomers it aspires to onboard.

### Scorecard

| Dimension | Score | Delta from Previous | Notes |
|---|---|---|---|
| Visual Design | 8.5/10 | +0.5 | Strong glassmorphism, consistent palette, good motion, but token "icons" are still letter circles |
| New-User Onboarding | 6/10 | -1 | WelcomeModal is informational-only; no guided first action; no progressive disclosure |
| DeFi Literacy Support | 7/10 | = | Tooltips cover major terms; still no "Learn" section or deeper education |
| Core User Flow (Supply) | 4/10 | -4 | **Token approval hook exists but is NOT wired into ActionCard -- first supply attempts fail** |
| Core User Flow (Borrow) | 7/10 | -1 | Works, but borrow button uses red "danger" styling creating negative friction |
| Transaction Safety | 5/10 | NEW | No confirmation step before signing; no collateral toggle guard; no error boundaries |
| Mobile UX | 4/10 | = | Sidebar collapses but no bottom nav, no hamburger menu |
| Trust & Safety Signals | 7/10 | = | Landing page has audit section; main app still lacks in-app trust signals |
| Product Marketing | 7.5/10 | +0.5 | Landing page is comprehensive; SEO/social metadata still minimal |
| Accessibility | 3/10 | NEW | No focus traps in modals, missing ARIA attributes, no keyboard navigation |

---

## Part 1: What QuickLend Does Well

### 1.1 Visual Design System (Strong)

| Strength | Implementation | File Reference |
|----------|---------------|----------------|
| Glassmorphism theme | Consistent `glass-panel` / `glass-panel-strong` CSS classes with backdrop blur | `globals.css:28-43` |
| Dark mode by default | Deep space background (`#05050A`) with vibrant accent contrasts | `globals.css:5-6`, `layout.tsx:20` |
| Color-coded risk signals | Green (#42e695) / Amber (#FFB800) / Red (#FF4B4B) consistently applied | `HealthDial.tsx:25-29`, `ActionCard.tsx:59-63` |
| Monospace numbers | Roboto Mono prevents layout jitter during real-time updates | `layout.tsx:13-16` |
| Smooth micro-interactions | Framer Motion throughout -- spring physics on dial, button scale, entrance animations | `Button.tsx:33-34`, `HealthDial.tsx:74-78` |
| Ambient background orbs | Soft colored gradients create depth without distraction | `layout.tsx:34-37` |

### 1.2 Core UX Patterns (Good)

| Strength | Details | File Reference |
|----------|---------|----------------|
| **Health Factor Dial** | Semi-circular SVG gauge with animated needle; spatial processing is faster than reading decimals | `HealthDial.tsx` |
| **Dual-Action Input** | ActionCard shows `current HF -> projected HF` in real-time as user types | `ActionCard.tsx:191-209` |
| **Projected Liquidation Price** | Dynamic calculation shown during borrow/repay with color-coded direction | `ActionCard.tsx:213-243` |
| **Welcome Modal** | First-visit onboarding with 3 steps, persisted via localStorage | `WelcomeModal.tsx`, `page.tsx:39-48` |
| **Contextual tooltips** | Key DeFi terms explained in plain language on hover/focus | `Tooltip.tsx`, used in dashboard/markets/ActionCard |
| **Empty state CTAs** | Dashboard shows best APY and direct supply button when no positions exist | `page.tsx:163-186` |
| **Toast lifecycle** | Pending -> Confirming -> Success/Error tracking through full tx lifecycle | `useActionModal.ts:28-85`, `ToastContainer.tsx` |
| **Supply/Withdraw toggle** | One modal handles paired actions via tab toggle | `ActionCard.tsx:114-166` |
| **Personalized greeting** | Time-aware navbar greeting with wallet address | `Navbar.tsx:24-55` |

### 1.3 Architecture (Solid)

- **Atomic design** with atoms (`Button`, `GlassCard`, `Tooltip`, `TokenIcon`, `TickerNumber`), organisms, and page templates
- **Hook-based logic** cleanly separates data fetching (`useMarkets`, `useUserPositions`), write actions (`useLendingActions`), UI orchestration (`useActionModal`), and token approval (`useTokenApproval`)
- **5 distinct pages** (Dashboard, Markets, Portfolio, History, Settings) providing a complete navigation structure
- **RainbowKit** integration with dark theme provides familiar wallet connection
- **TanStack Query** with 15s refetch interval keeps data fresh without manual refreshing
- **Separate landing page** project with comprehensive marketing sections

### 1.4 Previously Fixed Issues (Verified)

The following items from the prior review have been confirmed as implemented:

- ActionCard supports all 4 action types (supply/withdraw/borrow/repay) with correct toggle switching
- Liquidation price is dynamically calculated from `calculateHealthFactor()`, not hardcoded
- History page resolves contract addresses to token symbols using market data
- Transaction toasts track the full wallet confirmation -> chain confirmation -> success/error lifecycle
- Wallet dropdown has working copy-address and view-on-explorer functions
- Portfolio page has a functional collateral toggle wired to `setCollateral` contract call
- Navbar shows contextual greeting based on time of day and connection status

---

## Part 2: Critical Gaps (Must Fix)

### 2.1 Token Approval Flow Not Wired Into ActionCard (Severity: CRITICAL)

**Problem:** The `useTokenApproval` hook (`hooks/useTokenApproval.ts`) is fully implemented -- it reads ERC-20 allowances, checks if approval is needed, and can execute `approve()` calls. However, **it is never integrated into the ActionCard or `useActionModal`**. The ActionCard directly calls `supply()` or `repay()` without first checking or requesting token approval.

**Evidence:**
- `useTokenApproval.ts` exports `needsApproval()`, `approveMax()`, `approveAmount()` -- none called anywhere
- `useActionModal.ts:107-108` calls `supply(assetAddress, amount, decimals)` directly
- `ActionCard.tsx:257-265` fires `onConfirm(parseFloat(amount), action)` with no approval check

**Impact:** Every first-time supply or repay attempt will fail with a contract revert. This is the **single most damaging UX bug** because it blocks the very first meaningful user action. The error message shown in the toast will be a truncated Solidity revert string, which is incomprehensible to new users.

**Recommendation:**
- Integrate `useTokenApproval` into `useActionModal` or the ActionCard
- Show a two-step flow when allowance is insufficient:
  1. "Approve USDC" button (with explanation: "This gives QuickLend permission to use your tokens. One-time step per token.")
  2. "Supply USDC" button (enabled only after approval confirms)
- Show approval status with a checkmark and "Approved" label
- Consider supporting Permit2 for gasless approvals as a future enhancement

### 2.2 No Transaction Confirmation/Review Step (Severity: HIGH)

**Problem:** Clicking "Supply USDC" in the ActionCard immediately fires the blockchain transaction (`ActionCard.tsx:261`). There is no intermediate summary screen. The Design Philosophy document explicitly calls for showing estimated gas, but this is absent.

**Impact:** Users, especially newcomers, need a moment to review before committing irreversible on-chain actions. Without a review step:
- Users may accidentally supply the wrong amount (they typed "100" meaning $100 but it was 100 tokens)
- No gas fee visibility means unexpected costs
- No explicit "this is irreversible" warning

**Recommendation:**
- After clicking the action button, show a confirmation panel (within the same modal) summarizing:
  - Action + amount + USD value
  - Resulting Health Factor (already calculated)
  - Estimated gas fee (use wagmi's `estimateGas`)
  - "Confirm in Wallet" primary button + "Back" secondary button
- For actions that would push HF below 1.5, add a warning banner

### 2.3 No Error Boundaries (Severity: HIGH)

**Problem:** There are no React Error Boundary components anywhere in the frontend. An unhandled error in any component (e.g., a contract read returning unexpected data, a wallet disconnect during rendering) will crash the entire app with a white screen.

**Impact:** Users lose all context and must manually reload. This is especially problematic during wallet interactions, network switches, and contract calls where errors are common.

**Recommendation:**
- Add error boundaries at the page level and around `Web3Provider`
- Show a recovery UI: "Something went wrong. Your funds are safe. [Reload Page]"
- Log errors to a tracking service for monitoring

### 2.4 No Collateral Toggle Confirmation (Severity: HIGH)

**Problem:** In the Portfolio page (`portfolio/page.tsx:119-131`) and UserSuppliesTable (`UserSuppliesTable.tsx:95-108`), toggling collateral off triggers an immediate contract call with no confirmation dialog. Disabling collateral can push Health Factor below 1.0 and trigger liquidation.

**Impact:** One accidental tap could cause significant financial loss. This is a safety-critical interaction that needs a guard.

**Recommendation:**
- Show a confirmation dialog before disabling collateral, displaying:
  - Current and projected Health Factor
  - Warning if projected HF < 1.5
  - Block the action entirely if projected HF < 1.0
- Enabling collateral (safe action) can remain one-click

---

## Part 3: UX Polish Gaps

### 3.1 Borrow Button Uses "Danger" Red Styling (Severity: MEDIUM)

**Problem:** The Borrow buttons use `variant="danger"` (red gradient `#FF4B4B` -> `#FF416C`) in the Assets to Borrow table (`page.tsx:329`) and in the ActionCard toggle (`ActionCard.tsx:143-149`). Red universally signals "warning" or "destructive action."

**Impact:** Borrowing is a core feature, not an inherently dangerous action. Red creates negative psychological friction that discourages a primary user flow. New users may avoid borrowing because the color signals risk.

**Recommendation:**
- Use the amber/gold color (`#FFB800`) or primary blue for Borrow buttons -- matching the borrow APY color creates visual consistency
- Reserve red exclusively for destructive actions (disconnect, liquidation warnings, withdraw-all)

### 3.2 Token Icons Are Letter Circles, Not Real Logos (Severity: MEDIUM)

**Problem:** `TokenIcon.tsx` renders a colored circle with the first letter of the token symbol (e.g., blue "U" for USDC). While the colors are brand-appropriate, there are no actual token logos.

**Impact:** Real token logos are universal trust signals in crypto UIs. Their absence makes the protocol feel like a prototype and makes token identification slower.

**Recommendation:**
- Use actual SVG token logos (source from the trustwallet/assets repository or CoinGecko)
- Fall back to the current letter-circle for unknown/unlisted tokens
- Show full token names in at least one view (e.g., "USDC" + "USD Coin" subtitle)

### 3.3 No Loading Skeletons (Severity: MEDIUM)

**Problem:** While data loads, the UI shows either nothing (zero/empty states) or a single Loader2 spinner (History page only). The dashboard shows "infinity" Health Factor and $0.00 stats during initial load, which is confusing.

**Impact:** Users cannot distinguish "loading" from "you have no data." A Health Factor of infinity looks like a bug, not a loading state.

**Recommendation:**
- Add shimmer skeleton components for tables, stat cards, and the Health Dial
- Show `---` or a skeleton placeholder instead of `infinity` / `$0.00` while data is loading
- Health Dial should show a neutral gray needle position during load

### 3.4 No Mobile Bottom Navigation (Severity: MEDIUM)

**Problem:** The sidebar collapses from 256px to 80px on mobile (`Sidebar.tsx:46`), showing only icons without labels. There is no bottom navigation bar, which is the standard mobile pattern.

**Impact:** Mobile users must reach to the far-left corner for navigation, which is poor ergonomics. Icon-only navigation without labels fails discoverability for new users.

**Recommendation:**
- Add a fixed bottom tab bar for screens < 768px: Dashboard, Markets, Portfolio, History
- Hide the sidebar entirely on mobile
- Keep Settings accessible from a profile icon in the navbar

### 3.5 Transaction History Links Are Not Clickable (Severity: MEDIUM)

**Problem:** The History page shows truncated tx hashes with an ExternalLink icon (`history/page.tsx:128-130`), but these are rendered as a `<span>`, not an `<a>` tag. Users cannot click to verify transactions on a block explorer.

**Impact:** Reduces trust and makes transaction debugging impossible. Block explorer verification is a fundamental DeFi UX expectation.

**Recommendation:**
- Wrap tx hashes in `<a>` tags linking to the chain's block explorer
- Use `chain.blockExplorers.default.url` (already available via wagmi) to construct URLs

### 3.6 Liquidation Price Not Visible on Dashboard (Severity: MEDIUM)

**Problem:** The liquidation price is only visible inside the ActionCard modal during borrow/repay actions (`ActionCard.tsx:213-243`). On the dashboard, users cannot see at a glance what price movement would trigger liquidation.

**Impact:** The most critical risk metric is hidden behind an action modal that users have no reason to open just to check risk.

**Recommendation:**
- Add a liquidation price indicator to the dashboard hero section, next to the Health Factor
- Show per-asset liquidation prices in the Your Borrows section
- Consider: "Your WETH will be liquidated if its price drops to $X"

### 3.7 No Keyboard/Accessibility Support in Modals (Severity: MEDIUM)

**Problem:** Neither ActionCard nor WelcomeModal implements focus trapping. Pressing Tab moves focus to elements behind the modal. Pressing Escape doesn't close the modal. No `role="dialog"` or `aria-modal="true"` attributes.

**Impact:** WCAG 2.1 compliance failure. Also poor experience for keyboard users and screen reader users.

**Recommendation:**
- Add focus trap to all modals (use a library like `focus-trap-react` or implement manually)
- Close modals on Escape key
- Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes
- Ensure all interactive elements have visible focus indicators (currently some only show on hover)

---

## Part 4: Product & Marketing Gaps

### 4.1 Main App Has No Connection to Landing Page (Severity: HIGH)

**Problem:** The landing page exists as a separate Next.js project (`landing-page/`), but the main frontend app (`frontend/`) drops all visitors -- authenticated or not -- directly onto the Dashboard at `/`. There is no routing from the landing page to the app, no shared navigation, and no in-app hero for disconnected users.

**Impact:** The landing page's marketing value is disconnected from the app experience. A user who arrives at the app URL directly (not through the landing page) sees a dashboard with a "Connect Wallet" prompt but no value proposition or context.

**Recommendation:**
- Option A: Integrate a lightweight hero section into the main app's disconnected state (expand the current "Connect Your Wallet" card into a mini landing page with feature highlights)
- Option B: Set up routing so the app root redirects to the landing page for unauthenticated visitors
- Either way, the landing page's "Launch App" CTA should link to the frontend app URL

### 4.2 No In-App Trust Signals (Severity: MEDIUM)

**Problem:** While the landing page has SecuritySection and StatsSection, the main application UI shows no trust signals -- no TVL, no audit badge, no user count, no "non-custodial" label.

**Impact:** Users who arrive at the app directly (bookmarked, shared link) see no social proof. DeFi users evaluate protocol safety partly through visible trust indicators.

**Recommendation:**
- Add a subtle footer to the app with: audit badge, open-source link, TVL counter
- Show total TVL in the Markets page header (data available from backend `/api/v1/analytics/tvl`)
- Add a small "Audited" badge near the logo in the sidebar

### 4.3 No Educational "Learn" Section (Severity: MEDIUM)

**Problem:** QuickLend targets new crypto users but provides no educational content beyond brief tooltip text. DeFi concepts (over-collateralization, liquidation, interest rate models, Health Factor management strategies) are never explained in depth.

**Impact:** New users must learn DeFi from external sources, creating friction and abandonment risk.

**Recommendation:**
- Add a "Learn" section accessible from the sidebar with beginner-friendly articles:
  - "What is DeFi Lending?"
  - "Understanding Health Factor and Avoiding Liquidation"
  - "Supply vs. Borrow: Which Strategy Is Right for You?"
- Add contextual "Learn more" links in tooltips
- Consider an interactive risk simulator: "See how different amounts affect your Health Factor"

### 4.4 SEO and Social Sharing Metadata (Severity: LOW)

**Problem:** The main app has minimal metadata: `title: "QuickLend"`, `description: "Hyper-Modern DeFi Lending Protocol"` (`layout.tsx:18-21`). No Open Graph tags, no Twitter Card meta, no branded favicon.

**Impact:** Shared links on Twitter/Discord show no preview. Search engine discoverability is minimal.

**Recommendation:**
- Add OG and Twitter Card meta tags with a preview image showing the Health Dial UI
- Write a compelling description for each route
- Add branded favicons and Apple touch icons

---

## Part 5: Technical UX Debt

### 5.1 Settings Page Is Non-Functional (Severity: LOW)

**Problem:** The Settings page currency selector (USD/EUR/GBP) and language dropdown are local React state only. They don't persist on refresh and don't affect the app. `formatCurrency()` in `utils.ts:8-15` is hardcoded to USD. Notification toggles are cosmetic only.

**Impact:** Users who change settings see them reset on reload. Creates a broken experience.

**Recommendation:**
- Either implement with persistence (localStorage + context) and wire into `formatCurrency()`
- Or remove non-functional controls to avoid false expectations
- Wire notification preferences to the backend `notificationPreferences` table (schema already exists)

### 5.2 Molecules Layer Is Empty (Severity: LOW)

**Problem:** The `components/molecules/` directory has no components. The architecture jumps from atoms to organisms.

**Impact:** Repeated UI patterns are implemented inline rather than as reusable composables.

**Recommendation:**
- Extract common patterns:
  - `StatCard` (label + monospace value + optional tooltip) -- used in dashboard, markets, portfolio
  - `AssetRow` (token icon + symbol + value) -- used in every table
  - `SearchInput` (glass input + search icon) -- duplicated between pages

### 5.3 No PWA Support (Severity: LOW)

**Problem:** No `manifest.json`, no service worker, no installability. The design philosophy states "Mobile-First" but there's no progressive web app support.

**Recommendation:**
- Add a web app manifest with icons and theme color
- Implement a service worker for the app shell
- This aligns with the mobile-first philosophy and enables home-screen installation

---

## Part 6: Competitive Positioning & Selling Points

### 6.1 Already Built -- Amplify These

| Feature | Competitive Edge | Marketing Angle |
|---------|-----------------|-----------------|
| **Health Factor Dial** | No other lending protocol uses a visual gauge. Aave and Compound show raw numbers. | "See your risk, don't just read it." |
| **Real-time Projected HF** | Users see impact before signing. Aave shows this but less visually. | "Know your outcome before you commit." |
| **Glassmorphism Design** | Distinctive visual brand vs "corporate DeFi" look of Aave/Compound. | "DeFi that looks as modern as it works." |
| **One-Modal Actions** | Supply/withdraw and borrow/repay toggle in one modal. No page navigation needed. | "Supply, withdraw, borrow, repay -- all in one place." |
| **Animated Transitions** | Spring physics, entrance animations, ticker numbers create a premium feel. | "Every interaction feels intentional." |

### 6.2 Build These for Maximum Differentiation

| Feature | Why It Matters | Priority |
|---------|---------------|----------|
| **One-Click Approve+Supply** | Eliminate the multi-step approval dance. Detect missing allowance, batch approve+supply seamlessly. | Critical |
| **Interactive Risk Simulator** | Let users drag a slider to see "what if ETH drops 30%?" -- Health Dial updates live. No competitor offers this. | High |
| **Plain-English Liquidation Alerts** | Instead of "HF < 1.0", show "If ETH drops to $1,850, your collateral will be partially sold to repay debt." | High |
| **Portfolio Performance Graph** | Show historical net worth and APY using `marketSnapshots` data (already indexed by backend). | Medium |
| **Health Factor Push Alerts** | Notify via email/push when HF approaches danger. Backend `notificationPreferences` schema exists. | Medium |
| **Mobile-Native PWA** | Bottom nav + swipe gestures + home screen install. | Medium |
| **APY Sparkline Charts** | 7/30-day APY trends per market using stored `marketSnapshots`. | Low |

### 6.3 Competitive Comparison

| Feature | Aave | Compound | **QuickLend** |
|---|---|---|---|
| Real-time HF preview as you type | Partial | No | **Yes** |
| Visual health gauge | No | No | **Yes (Dial)** |
| UI learning curve | High | Very High | **Lower** |
| New user onboarding | Minimal | None | **WelcomeModal (improve to guided flow)** |
| Mobile experience | Adequate | Poor | **Needs bottom nav** |
| Gasless approvals (EIP-2612) | Yes (some tokens) | No | **Not yet (roadmap)** |
| Educational content | Academy (separate) | Docs only | **Not yet (add Learn section)** |

---

## Part 7: Prioritised Roadmap

### Phase 1: Fix Critical Blockers
> *These must be fixed before any user acquisition effort.*

| # | Item | Type | Impact |
|---|------|------|--------|
| 1 | Wire `useTokenApproval` into ActionCard supply/repay flow | Bug | Unblocks all first-time supply attempts |
| 2 | Add transaction confirmation/review step before wallet popup | UX | Prevents accidental transactions |
| 3 | Add collateral toggle confirmation dialog with projected HF | Safety | Prevents accidental liquidation |
| 4 | Add React error boundaries at page and provider level | Stability | Prevents white-screen crashes |
| 5 | Make tx hashes clickable links to block explorer in History | UX | Enables transaction verification |

### Phase 2: Onboard New Users
> *Close the gap between "polished dashboard" and "accessible for everyone."*

| # | Item | Type | Impact |
|---|------|------|--------|
| 6 | Replace WelcomeModal with step-by-step guided first-action flow | UX | Guides new users through their first supply |
| 7 | Add fiat on-ramp guidance for zero-balance wallets | UX | Eliminates "I have no tokens" dead-end |
| 8 | Fix borrow button color (amber/blue instead of danger red) | UX | Removes negative friction from core action |
| 9 | Add loading skeleton states for all data-dependent views | UX | Eliminates confusing zero/infinity states |
| 10 | Connect landing page to main app (routing or in-app hero) | Product | Creates coherent entry experience |

### Phase 3: Build Trust & Depth
> *Differentiate and retain users.*

| # | Item | Type | Impact |
|---|------|------|--------|
| 11 | Add in-app trust signals (TVL, audit badge, non-custodial label) | Trust | Builds confidence for new users |
| 12 | Replace letter-circle token icons with real SVG logos | Polish | Makes the app feel production-ready |
| 13 | Add liquidation price indicator to dashboard | Safety | Surfaces critical risk info without modal |
| 14 | Add educational "Learn" section with DeFi explainers | Education | Reduces concept barrier for newcomers |
| 15 | Implement settings persistence (localStorage + context) | Completeness | Settings that actually work |

### Phase 4: Differentiate & Scale
> *Build features no competitor has.*

| # | Item | Type | Impact |
|---|------|------|--------|
| 16 | Interactive risk simulator (slider + live Health Dial) | Differentiator | Unique feature for risk education |
| 17 | Portfolio performance charts (historical net worth + APY) | Engagement | Uses existing marketSnapshots data |
| 18 | Mobile bottom navigation bar | Mobile | Standard mobile UX pattern |
| 19 | PWA support (manifest + service worker) | Mobile | Home-screen installability |
| 20 | Modal accessibility (focus traps, Escape key, ARIA) | Accessibility | WCAG compliance |
| 21 | Push/email alerts for Health Factor thresholds | Retention | Backend schema already exists |

---

## Conclusion

QuickLend's design system and core interaction patterns are above average for the DeFi space. The Health Dial, projected Health Factor preview, and glassmorphism aesthetic create a distinctive brand identity that differentiates it from the utilitarian interfaces of Aave and Compound.

However, the product has a critical functional gap: **the token approval flow is implemented but not connected**, meaning every first-time supply attempt will fail. This must be fixed before any marketing or user acquisition effort.

Beyond that, the product currently assumes its users understand DeFi concepts, have tokens ready, and know how wallet approvals work. Closing the gap between "polished DeFi dashboard" and "accessible lending for everyone" requires:

1. **Quick to start** -- Fix the approval flow, add a confirmation step, connect the landing page
2. **Quick to understand** -- Build guided onboarding, add educational content, use plain language for risk
3. **Quick to act** -- Already strong; maintain the one-modal design and real-time previews

The "Quick" in QuickLend should mean: *quick to understand, quick to start, quick to act.* The current implementation delivers well on "quick to act" but needs focused work on "quick to understand" and "quick to start."
