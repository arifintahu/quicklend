# QuickLend — UX/UI & Product Marketing Improvement Analysis

> **Analyst Role:** Product UI/UX + Product Marketing
> **Date:** 2026-02-20
> **Vision:** *"QuickLend — supply and borrow tokens so seamlessly, even new crypto users feel right at home."*

---

## Executive Summary

QuickLend has built a technically solid DeFi lending protocol with a visually polished dark-mode UI. The glassmorphism design system, Health Factor Dial, real-time preview of transaction impact, and animated transitions are genuine strengths that lift it above many DeFi interfaces.

However, **the vision of reaching new crypto users is not yet achieved.** The product currently assumes the user already understands DeFi concepts (health factor, collateral, LTV, liquidation, qTokens), owns crypto, and knows how to connect a wallet. There is no guided entry path, no educational scaffolding, no landing page, and several functional gaps that would confuse or block a first-time user.

The table below scores the current state against the stated vision:

| Dimension | Score | Notes |
|---|---|---|
| Visual Design | 8/10 | Strong glassmorphism, consistent palette, good motion |
| New-User Onboarding | 2/10 | No landing page, no tooltips, no guided flow |
| DeFi Literacy Support | 1/10 | Jargon everywhere, zero explanations |
| Core User Flow (Supply) | 6/10 | Works but lacks feedback, icons, and contextual help |
| Core User Flow (Borrow) | 5/10 | Works, but withdraw/repay share modal with bugs |
| Mobile UX | 4/10 | Sidebar collapses, no bottom nav, not touch-optimised |
| Trust & Safety Signals | 3/10 | No audit badges, no TVL hero, no risk explainer |
| Product Marketing | 2/10 | No landing page, no value proposition visible |

---

## Part 1: What the Current Implementation Does Well

### 1.1 Visual Foundation
- **Glassmorphism system** is well-executed with consistent `glass-panel` and `glass-panel-strong` utilities used across modals and cards.
- **Color semantics** are clear and consistent: cyan for supply/positive, amber for warnings/borrow, red for danger. New users can learn these associations quickly through repetition.
- **Roboto Mono for numbers** prevents layout jitter as values update — a thoughtful UX detail.
- **Framer Motion animations** (slide-in, scale, spring needle) make the interface feel alive without being distracting.

### 1.2 Health Factor Dial
The animated SVG gauge (`HealthDial.tsx`) is the single best UX feature in the product. The spring-animated needle, colour-coded gradient arc, and real-time update on input change all align with the design philosophy of "visual proof of safety." This is a genuine selling point.

### 1.3 Projected Health Factor Preview
The `ActionCard` shows `current HF → projected HF` with directional colour-coded values as the user types an amount. This is excellent progressive disclosure — the most important risk signal is surfaced exactly when the user needs it.

### 1.4 Information Architecture
The five-section nav (Dashboard, Markets, Portfolio, History, Settings) is logical and scales well. The dashboard's separation of "Your Supplies / Your Borrows" from "Assets to Supply / Assets to Borrow" provides clear mental models.

### 1.5 Backend Infrastructure
Real-time indexing, 30s-TTL market cache, event materialization, and Swagger-documented REST API give the product a strong foundation for analytics, notifications, and future features.

---

## Part 2: Critical Gaps vs. the New-User Vision

### 2.1 No Landing / Marketing Page ❌ HIGH PRIORITY

**Problem:** When an unauthenticated user visits the app, they land directly on the Dashboard — a wall of numbers with a "Connect Wallet" prompt. There is no explanation of what QuickLend is, what they can do, or why they should trust it.

**Impact:** A user unfamiliar with DeFi will immediately bounce. Even a crypto-savvy user has no reason to trust an unnamed protocol with no stated TVL, no security claims, and no social proof.

**Recommendation:** Create a dedicated landing page (`/landing` or a conditional homepage wrapper for unauthenticated users) with:
- Hero: One-sentence value proposition + "Start Earning" CTA
- Three-column feature highlights: Supply → Earn, Borrow → Spend, Safe → Audited
- Live protocol stats: Total Value Locked, total markets, current best APY
- "How it works" — three steps with illustrations
- Security section: audit status, open-source link, non-custodial claim
- Footer: social links, docs, terms

---

### 2.2 Zero Onboarding or Guided First Run ❌ HIGH PRIORITY

**Problem:** A first-time user who connects a wallet sees a Health Factor of ∞, two empty tables, and a list of assets to supply with no guidance on what to do first.

**Impact:** DeFi onboarding abandonment is well-documented. Without a guided path, the product loses the exact audience ("new crypto users") it claims to target.

**Recommendation:**
- **Welcome modal / checklist** on first visit:
  Step 1: Learn what supplying means → Step 2: Supply your first asset → Step 3: Understand your health factor
- **Contextual empty-state prompts** with call-to-action: The current "Nothing supplied yet" message is passive. Replace with: *"Earn up to X% APY on USDC. Supply now →"*
- **"New to DeFi?" banner** with a link to a simple glossary or explainer page

---

### 2.3 No Tooltips or Contextual Education ❌ HIGH PRIORITY

**Problem:** Terms used throughout the UI — Health Factor, Collateral, LTV, Borrow Power, Utilization, qTokens, Liquidation — are presented with no explanation anywhere in the product.

**Impact:** These terms are industry jargon. A new crypto user has no frame of reference for a "health factor of 1.5" or why utilization of 80% is coloured amber.

**Recommendation:**
- Add `[?]` tooltip icons next to every DeFi-specific term. On hover/tap, show a 1–2 sentence plain-language explanation. Examples:
  - **Health Factor:** *"Your safety score. Above 1.0 means your loan is safe. Below 1.0 and your collateral can be seized."*
  - **Borrow Power Used:** *"What percentage of your maximum borrowing capacity you are currently using."*
  - **Utilization:** *"How much of the deposited funds are currently lent out. Higher utilization → higher interest rates."*
  - **APY:** *"Annual Percentage Yield — how much interest you earn (or pay) per year, compounded."*
- **Health Dial legend**: Add "Safe Zone" and "Danger Zone" labels to the dial arc.

---

### 2.4 Missing Asset Token Icons ⚠️ MEDIUM PRIORITY

**Problem:** All market assets display only the first letter of their ticker (e.g., "U" for USDC, "W" for WETH) in a grey circle. No actual token logos are shown.

**Impact:** Recognisable token logos (USDC blue circle, WETH diamond, WBTC orange) are strong visual trust signals. Their absence makes the protocol feel unfinished compared to Aave or Compound, and makes scanning the table slower for users unfamiliar with ticker symbols.

**Recommendation:**
- Integrate a token logo source (e.g., Trust Wallet asset list, CoinGecko token images, or a local `/public/tokens/` directory) to display actual token logos.
- At minimum, use a colour-coded circle per asset with the logo as an overlay.

---

### 2.5 ActionCard: Withdraw and Repay Actions Are Broken ❌ HIGH PRIORITY (Bug)

**Problem:** In `app/page.tsx`, the action callbacks for withdraw and repay are mapped to the wrong actions:
```tsx
// Bug: both map to 'supply' and 'borrow' instead of 'withdraw' and 'repay'
onWithdraw={(asset) => setSelectedAsset({ asset, action: 'supply' })}
onRepay={(asset) => setSelectedAsset({ asset, action: 'borrow' })}
```
Furthermore, `ActionCard` only supports `'supply' | 'borrow'` — there is no `'withdraw'` or `'repay'` tab, even though the toggle says "Supply" and "Borrow" when withdrawing or repaying.

**Impact:** A user who clicks "Withdraw" from their supply position is presented with a "Supply" modal. They can accidentally supply more rather than withdraw. This is a critical UX and functional regression.

**Recommendation:**
- Extend `ActionCard` to support four actions: `supply | borrow | withdraw | repay`
- The toggle should switch between the paired actions: Supply ↔ Withdraw, Borrow ↔ Repay
- Correct the callbacks in `page.tsx` to pass the correct initial action

---

### 2.6 Transaction History Shows Contract Addresses, Not Token Names ⚠️ MEDIUM PRIORITY (Bug)

**Problem:** In `app/history/page.tsx`, the Asset column renders `shortenHash(tx.asset)` — showing a truncated contract address like `0x1234...5678` instead of the token symbol (USDC, WETH, etc.).

**Impact:** A user reviewing their history cannot determine which asset was involved in each transaction without external lookup.

**Recommendation:**
- Map asset contract addresses to their symbols using the market data or a static lookup table from `lib/contracts.ts`
- Display the token symbol and logo, not the raw address

---

### 2.7 Liquidation Price is Hardcoded ❌ HIGH PRIORITY (Bug)

**Problem:** In `ActionCard.tsx`, the liquidation price preview is hardcoded:
```tsx
<span className="text-gray-300">$1,850.00</span>
<ArrowRight size={14} />
<span className="text-[#FF4B4B]">$2,100.00</span>
```
These values never change regardless of position size or asset.

**Impact:** This is a safety-critical display. Users making borrowing decisions rely on liquidation price to manage risk. Hardcoded values are actively misleading.

**Recommendation:**
- Calculate actual liquidation price from: `collateralValue × liquidationThreshold / totalDebt`
- Display the per-collateral-asset liquidation price for the primary collateral
- Update dynamically as the user types an amount

---

### 2.8 Filter Button on Markets Page Does Nothing ⚠️ MEDIUM PRIORITY

**Problem:** The Markets page has a "Filter" button that renders with a chevron icon but has no functionality — no dropdown, no filter options, no state change.

**Impact:** Non-functional UI elements damage user trust and signal an incomplete product.

**Recommendation:** Either implement the filter (e.g., filter by asset type, APY range, utilization) or remove the button until the feature is ready. A "Sort by" dropdown would be more immediately useful than a filter.

---

### 2.9 Mobile UX Is Incomplete ⚠️ MEDIUM PRIORITY

**Problem:** On mobile (`< md`), the sidebar collapses to a 20px-wide icon bar. There is no hamburger menu, no bottom navigation bar (standard for mobile apps), and no slide-out drawer.

**Impact:** Mobile users make up a significant portion of DeFi interactions. The current mobile experience is functional in the narrowest sense but fails to meet modern mobile UX standards.

**Recommendation:**
- Replace the icon-only sidebar with a fixed bottom navigation bar on mobile (Dashboard, Markets, Portfolio, History)
- The Navbar hamburger should toggle a full-screen drawer for navigation on mobile
- Ensure the `ActionCard` modal is fully touch-accessible with large tap targets

---

### 2.10 No Feedback on Transaction Submission ⚠️ MEDIUM PRIORITY

**Problem:** When a user confirms an action (supply, borrow, etc.), there is no visible feedback — no toast notification, no loading state in the button, no success/error message. The user has to navigate to the History page to see if their transaction was processed.

**Impact:** Crypto transactions take 1–30 seconds to confirm. Without feedback, users don't know if their action was registered, leading to confusion and double-submissions.

**Recommendation:**
- Add a toast/snackbar notification system for transaction states:
  - Pending: "Supplying 100 USDC… (tap to view)"
  - Confirmed: "100 USDC supplied successfully"
  - Failed: "Transaction failed: insufficient gas"
- Show a loading spinner inside the "Supply / Borrow" button after the user confirms

---

### 2.11 Settings Are Not Persisted ⚠️ LOW PRIORITY

**Problem:** The currency and notification settings on the Settings page use local React state. Refreshing the page resets all settings.

**Impact:** Users who set their preferred currency to EUR will see USD again on the next visit. The notification toggles are also purely cosmetic (they don't connect to the backend notification system).

**Recommendation:**
- Persist preferences in `localStorage` for immediate improvement
- For notifications: wire the liquidation risk toggle to the backend `notificationPreferences` table (the schema already supports this)
- The "Copy Address" and "View on Etherscan" buttons in the wallet dropdown are also non-functional; implement them

---

### 2.12 Navbar Greeting Is Static ⚠️ LOW PRIORITY

**Problem:** The Navbar always shows "Welcome back to QuickLend" regardless of whether the user is new or returning, connected or not.

**Recommendation:**
- Show wallet address or ENS name when connected
- Show "Get started by connecting your wallet" when not connected
- Show time-aware greeting: "Good morning / afternoon / evening"

---

### 2.13 Portfolio Page Collateral Toggle Is Display-Only ⚠️ MEDIUM PRIORITY

**Problem:** The Portfolio page shows a small dot indicating collateral status but provides no way to toggle it. The actual collateral toggle (`setCollateral` in `useLendingActions`) exists in the codebase but is not wired to any UI in the portfolio page.

**Recommendation:**
- Replace the dot indicator with a clickable toggle switch that calls `setCollateral`
- Add a tooltip: *"Toggle whether this asset is used as collateral for your loans"*

---

### 2.14 No Loading Skeleton States ⚠️ LOW PRIORITY

**Problem:** While market data or user positions are loading, the UI shows blank/empty content or a single centered `Loader2` spinner (only on the History page). Other pages show no loading indication.

**Recommendation:**
- Add skeleton placeholders for market table rows, health dial, and position cards
- Use animated shimmer effect (consistent with the glassmorphism aesthetic)

---

### 2.15 No APY History Charts ⚠️ LOW PRIORITY

**Problem:** The Markets page and market rows display only current APY values. There is no historical trend visible.

**Impact:** APY volatility matters for users comparing protocols. Showing a 30-day APY sparkline would significantly increase the informational value of the Markets page and differentiate QuickLend from simpler interfaces.

**Recommendation:**
- Add sparkline charts (7-day or 30-day) to each market row using data from the `marketSnapshots` table, which already stores periodic APY data
- Use Recharts or a lightweight charting library compatible with the existing stack

---

## Part 3: New User Journey — Gap Map

```
[New User Arrives]
        │
        ▼
   Landing Page    ← MISSING: No value prop, no features, no trust signals
        │
        ▼
   Connect Wallet  ← OK: RainbowKit covers this well
        │
        ▼
   First Dashboard ← MISSING: No onboarding checklist, no "what to do first"
        │
        ▼
   Select Asset    ← PARTIAL: No token icons, no tooltips on APY or LTV
        │
        ▼
   Supply Modal    ← PARTIAL: Health preview ✓, but liquidation price hardcoded
        │
        ▼
  Transaction Sent ← MISSING: No pending state, no success notification
        │
        ▼
  View Portfolio   ← PARTIAL: Shows data, but collateral toggle broken, no charts
        │
        ▼
   Borrow Modal    ← MISSING: No actual withdraw/repay distinction
        │
        ▼
 Monitor Risk      ← PARTIAL: Health dial works, but no push alerts, no LiqPrice
```

---

## Part 4: Product Marketing — Selling Points & Positioning

### 4.1 Unique Selling Points (USPs) to Emphasise

**1. "See Your Risk Before You Sign"**
The projected health factor preview in the action modal is a genuine differentiator. No other protocol shows you exactly how your health factor changes as you type. This should be the hero feature in marketing materials.

**2. "DeFi in Seconds, Not Hours"**
The QuickLend brand name promises speed. The single-modal supply/borrow flow (one approve + one action) delivers on this. Lean into the speed message: *"Supply USDC and start earning in 2 clicks."*

**3. Non-Custodial, Transparent, Open Source**
This is table-stakes for DeFi but must be stated explicitly. New users need to know they retain custody of their assets at all times. The security audit (in `SECURITY_AUDIT.md`) should be surfaced on the landing page.

**4. Multi-Asset Portfolios with One Health Score**
The cross-collateral design (supply WETH, borrow USDC, all tracked in one health factor) is powerful. Most new users don't realise this is possible. Show it visually: *"Use your ETH to unlock liquidity without selling."*

**5. Algorithmic, Fair Interest Rates**
Rates driven purely by supply/demand (utilization) with no governance votes or manual adjustments is a trust story. *"Rates set by math, not by a board."*

---

### 4.2 Messaging Framework

| Audience | Core Message | CTA |
|---|---|---|
| Crypto holders (HODL-ers) | "Make your idle ETH work for you" | Supply and earn |
| Stablecoin holders | "Earn 3–8% APY on USDC, no lock-up" | Start earning |
| DeFi power users | "Over-collateralised lending with real-time risk visualisation" | Explore markets |
| Newcomers | "Borrow dollars against your crypto without selling" | How it works |

---

### 4.3 Trust & Safety Signals to Add

The current UI has **no visible trust signals**. For a protocol handling user funds, this is a serious gap. Add:

- **"Audited" badge** with link to `SECURITY_AUDIT.md` in the UI footer and landing page
- **TVL counter** on the landing page and markets header (shows protocol health)
- **"Non-custodial" label** — explicitly state that QuickLend never holds your keys
- **Open-source badge** — link to the GitHub repository
- **Network/chain indicator** — always show which chain the user is on (already in wallet dropdown, but promote it)

---

### 4.4 Competitive Differentiation

Position QuickLend against Aave and Compound with:

| Feature | Aave | Compound | **QuickLend** |
|---|---|---|---|
| Real-time HF preview | Partial | No | **Yes — as you type** |
| UI complexity | High | Very High | **Simple** |
| New user onboarding | Minimal | None | **Guided (planned)** |
| Mobile UX | Adequate | Poor | **Optimised (planned)** |
| Gasless approvals | Yes | No | Roadmap |

---

## Part 5: Prioritised Improvement Roadmap

### Sprint 1 — Fix & Trust (must-do before any marketing)
1. **[BUG]** Fix withdraw/repay actions in `ActionCard` — wrong action type passed
2. **[BUG]** Replace hardcoded liquidation price with calculated value
3. **[BUG]** Show token symbol (not contract address) in transaction history
4. **[UX]** Add transaction pending/success/failed toast notifications
5. **[UX]** Add tooltips to Health Factor, LTV, Collateral, Utilization, APY
6. **[TRUST]** Implement "Copy Address" and "View on Etherscan" wallet menu items

### Sprint 2 — Onboarding & Discovery
7. **[NEW]** Build unauthenticated landing page with value proposition, protocol stats, and "How it works"
8. **[NEW]** Add first-visit onboarding checklist / welcome modal
9. **[UX]** Replace first-letter asset placeholders with real token logos
10. **[UX]** Add contextual empty-state CTAs with expected APY ("Earn up to X%")
11. **[BUG]** Wire collateral toggle in Portfolio page to `setCollateral` contract call

### Sprint 3 — Engagement & Depth
12. **[UX]** Implement working filter/sort on Markets page
13. **[UX]** Add APY sparkline charts using `marketSnapshots` data
14. **[UX]** Mobile bottom navigation bar
15. **[UX]** Skeleton loading states for all data-dependent views
16. **[FEATURE]** Persist settings to localStorage; wire notification preferences to backend

### Sprint 4 — Growth & Marketing
17. **[MARKETING]** Add TVL, audit badge, and open-source links to landing page and footer
18. **[FEATURE]** Implement push/email notification for liquidation risk (backend already has the schema)
19. **[FEATURE]** Add rewards/points system (currently "Coming Soon" in portfolio page)
20. **[FEATURE]** ENS name resolution for wallet display

---

## Part 6: Quick-Win Copy Changes (No Code Changes Needed)

These changes to existing text would immediately improve the new-user experience:

| Current | Suggested |
|---|---|
| "Welcome back to QuickLend" (always) | "Connect a wallet to get started" (unauthenticated) |
| "Nothing supplied yet" | "Earn up to X% APY on USDC — supply now →" |
| "Nothing borrowed yet" | "Unlock liquidity from your crypto without selling" |
| "Borrow Power Used" | "Borrow Power Used (how much of your capacity is in use)" |
| "Health Factor" (no context) | "Health Factor — stays above 1.0 to keep your loan safe" |
| "Rewards — Coming Soon" | "Earn QuickLend points on every interaction (launching soon)" |
| "No transactions yet" | "Your transaction history will appear here once you supply or borrow" |

---

## Conclusion

QuickLend has the technical depth and visual quality to compete with established DeFi protocols. The core loop — supply an asset, watch your health factor, borrow against it — works. The real-time health factor preview is genuinely differentiated.

The gap to the "even new crypto users" vision is primarily in:
1. **Entry experience** — no landing page, no onboarding
2. **Literacy scaffolding** — jargon without explanation
3. **Functional completeness** — several bugs in withdraw/repay/history
4. **Trust signals** — no visible security or TVL proof

Addressing Sprint 1 and Sprint 2 items would close the majority of this gap and create a product that genuinely delivers on the QuickLend promise: fast, safe, and approachable DeFi for everyone.
