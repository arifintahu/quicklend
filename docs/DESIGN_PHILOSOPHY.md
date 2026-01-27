# Design Philosophy: "Velocity & Veracity"

## 1. Design Philosophy: "Velocity & Veracity"

The name **QuickLend** implies two things: fast execution and immediate understanding. The design philosophy is built on three pillars:

1. **Reduced Cognitive Load:** Only show the user what they need for the current step. Hide the "advanced" metrics (like Ray-math indices) behind "info" tooltips.
2. **Visual Proof of Safety:** Every action (Supply/Borrow) must visually confirm the impact on the user’s Health Factor *before* they sign the transaction.
3. **Mobile-First Precision:** DeFi is moving to mobile. Components must be touch-friendly with high-contrast active states.

---

## 2. Color Palette

The palette uses **Deep Space** tones for stability, contrasted with **Electric Accents** to highlight growth and action.

| Element | Color Name | Hex Code | Purpose |
| --- | --- | --- | --- |
| **Primary** | Electric Velocity | `#00F0FF` | Primary actions, "Supply" buttons, and active states. |
| **Secondary** | Growth Green | `#00FF41` | Yield indicators (APY) and healthy Health Factors. |
| **Warning** | Liquidation Amber | `#FFB800` | Approaching borrowing limits or low health. |
| **Danger** | Alert Red | `#FF4B4B` | Liquidation risk and "Withdraw All" actions. |
| **Background** | Deep Charcoal | `#0B0E11` | Main background to reduce eye strain (Dark Mode). |
| **Surface** | Glass Slate | `#161A1E` | Cards, modals, and input fields. |

---

## 3. Taste & Theme: "Hyper-Modern Minimalist"

QuickLend moves away from the "bank-like" blues of traditional finance and the "hacker" aesthetic of early DeFi. It adopts a **sleek, glassmorphic** theme.

* **Glassmorphism:** Use of subtle background blurs on modals to provide a sense of hierarchy and depth without adding heavy borders.
* **Typography:** We use **Inter** or **Roboto Mono**.
* *Inter* for UI labels (highly legible).
* *Roboto Mono* for numbers and wallet addresses (conveys technical precision and prevents "number jumping" during updates).


* **Iconography:** Thin-stroke, geometric icons. Avoid 3D illustrations; stick to functional glyphs that guide the eye.

---

## 4. Component Theme Logic

### 4.1 The "Health Dial"

Instead of just a number (), QuickLend uses a semi-circular dial.

* **Reasoning:** Human brains process spatial position faster than numerical values. A needle moving toward the "Red Zone" creates an immediate visceral response that a decimal change does not.

### 4.2 The "Dual-Action" Input

Inputs for Supplying and Borrowing should always show the "Resulting State" in a sub-text.

* **Example:** "Borrowing 1,000 USDC will change your Health Factor from **2.1** to **1.4**."
* **Reasoning:** This reduces "signer's remorse" and prevents accidental liquidations by forcing the user to see the consequence of their action.

---

## 5. Design Reasoning

* **Why Dark Mode by default?** DeFi users often monitor markets for extended periods. Dark mode reduces blue light exposure and makes the vibrant "Growth Green" APYs pop significantly more than on a white background.
* **Why the Electric Blue?** Blue is the color of trust in finance (e.g., Chase, PayPal). By making it "Electric," we modernize that trust and align it with the high-speed nature of blockchain execution.
* **Why Monospace for numbers?** In a lending protocol, numbers change constantly due to interest accrual. Monospaced fonts ensure that as numbers increment, the UI doesn't "jitter" or shift, maintaining a stable visual experience.

---

## 6. Interaction States

* **Hover:** Subtle glow using the Primary color (`#00F0FF`) to indicate interactivity.
* **Loading:** A pulse animation rather than a spinning wheel to signify "continuous" blockchain synchronization.
* **Success:** A brief green "Success" haptic-like flash on the border of the card where the transaction occurred.

## QuickLend Figma Component Library

This list defines the specific UI components required to build the QuickLend dashboard, optimized for a **Hyper-Modern Minimalist** aesthetic.

---

### 1. Global Navigation & Header

* **Brand Logo:** Vectorized "QuickLend" logo using a bold sans-serif (Inter) with an "Electric Velocity" (`#00F0FF`) glyph representing a lightning bolt/graph.
* **Wallet Connector:** A "Glass Slate" (`#161A1E`) button showing the user's ENS name or truncated address (`0x12...34`) with a small "connected" green dot indicator.
* **Network Selector:** A dropdown with icons (Ethereum, Arbitrum, Polygon) to switch between different protocol deployments.

---

### 2. The "Quick-Health" Hero Section

* **Health Factor Dial:** A 180-degree gauge.
* **Visuals:** Color gradient from Alert Red (1.0) to Growth Green (3.0+).
* **Needle:** A thin `#00F0FF` line indicating current state.


* **Metric Cards:** Three high-level data points using **Roboto Mono** for the values:
1. **Net APY:** The weighted difference between supply and borrow rates.
2. **Total Collateral:** USD value of all supplied assets.
3. **Borrow Power:** A percentage bar showing "Amount Used" vs. "Total Available."



---

### 3. Market Action Cards (Supply/Borrow)

These are the most critical components. They must be designed for clarity and risk prevention.

| Component | Element | Style/Behavior |
| --- | --- | --- |
| **Asset Icon** | Logo + Name | e.g., USDC logo + "USD Coin" in semi-bold Inter. |
| **Input Field** | Amount + Max | Large numeric input with a "Max" button inside the field. |
| **Transaction Info** | Multi-line List | Shows: **Wallet Balance**, **New Health Factor**, and **Estimated Gas**. |
| **Action Button** | Large Button | Full-width. Changes label from "Approve" to "Supply" based on contract allowance state. |

---

### 4. Asset Tables (Markets)

A list of all supported tokens.

* **Columns:** Asset, Total Supplied, Supply APY, Total Borrowed, Borrow APY, and a "Collateral Toggle."
* **The Collateral Toggle:** A simple switch. If toggled "Off," the asset contributes to yield but does not increase the user's borrowing power (reducing liquidation risk).

---

### 5. Interaction Modals (Glassmorphism)

* **Backdrop:** 10px Gaussian blur on the background layer.
* **Border:** 1px solid stroke with 10% opacity white to create a "glass edge" effect.
* **The "Sign Transaction" State:** A pulse animation on the primary action button to indicate that the protocol is waiting for a wallet signature.

---

### Layout Structure (Z-Pattern)

1. **Top Left:** Branding/Navigation.
2. **Top Right:** Wallet/Network.
3. **Upper Center:** Health Factor Dial (Primary focus for user safety).
4. **Lower Left:** Supply Markets (To incentivize deposits).
5. **Lower Right:** Borrow Markets (To facilitate utility).

---

### Component Naming Convention

To keep the Figma file organized for developers, use the following naming:

* `QL / Atoms / Button / Primary`
* `QL / Molecules / Input / Numeric`
* `QL / Organisms / Card / Asset-Action`
* `QL / Templates / Dashboard`