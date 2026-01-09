# 🧪 Web3 Wallet QA Verification Guide

**Project:** Modular Web3 Wallet (Client-Side)  
**Environment:** Chrome/Brave/Firefox (Desktop & Mobile)  
**Network:** Sepolia Testnet (Primary Testing) & Ethereum Mainnet (Read-Only)

---

## 🛠️ Prerequisites
1.  **Server:** Ensure the project is served via `localhost` (using Live Server) or HTTPS (GitHub Pages).
    * *Note: Camera features (QR Scan) will NOT work on `file://` or `http://` (except localhost).*
2.  **Test Funds:** You need a wallet with **Sepolia ETH**.
    * Get free funds here: [Google Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia).

---

## 📋 Test Case 1: Wallet Management (Generation)
**Objective:** Verify new accounts can be created and backed up safely.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Click **"New Wallet"** button. | Wallet details appear. Phrase input is **masked** (dots) by default. |
| 2 | Click **"Show Words"** checkbox. | The 12-word seed phrase becomes visible text. |
| 3 | Uncheck **"Show Words"**. | The phrase reverts to masked dots (`••••`). |
| 4 | Click **"Copy"** button. | Alert/Notification says "Copied!". Paste into notepad to verify words match. |
| 5 | Verify **Public Address**. | A 42-character string starting with `0x` appears below the phrase. |
| 6 | Refresh the page. | The address in **Address Input** should auto-fill with the new wallet's address. |

---

## 📋 Test Case 2: Wallet Recovery & Persistence
**Objective:** Verify an existing user can log in and session is saved.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Enter a **Valid Phrase** in "Wallet Management" > "Enter Seed Phrase".<br>*(Use a test wallet phrase)* | Click **Load Wallet**. Status shows "✅ Loaded". Active address appears. |
| 2 | Enter an **Invalid Phrase** (e.g., "apple banana"). | Click **Load Wallet**. Status shows "❌ Invalid Phrase". |
| 3 | Refresh the page (F5). | The "Active Address" from Step 1 should automatically appear in the "Balance Check" input. |

---

## 📋 Test Case 3: Network & Asset Switching
**Objective:** Verify the "Config" layer updates the "Service" layer correctly.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Select **"Sepolia Testnet"** in dropdown. | Asset dropdown shows **SEP** and test tokens. |
| 2 | Select **"Ethereum Mainnet"** in dropdown. | Asset dropdown updates to show **ETH**, **USDT**, **USDC**. |
| 3 | Switch back to **Sepolia**. | Asset dropdown reverts to Sepolia assets. Balance text resets to `---`. |

---

## 📋 Test Case 4: Balance Checking
**Objective:** Verify reading data from Blockchain (Read-Only).

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | **Network:** Sepolia.<br>**Input:** Your loaded wallet address.<br>**Asset:** SEP. | Click **Check Balance**. Shows correct amount (e.g., `0.5 SEP`). |
| 2 | Change **Asset** to "TEST-UNI" (or any token in config). | Click **Check Balance**. Shows `0.00 TEST-UNI` (or actual balance). |
| 3 | Enter an **Invalid Address** (e.g., "0x123"). | Click **Check Balance**. Alert shows "Invalid Address". |
| 4 | **Network:** Mainnet.<br>**Input:** `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (Vitalik). | Click **Check Balance**. Shows a large amount of ETH. |

---

## 📋 Test Case 5: Sending Transactions
**Objective:** Verify writing data to Blockchain (Gas fees involved).

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | **Load Wallet:** Ensure wallet has Sepolia ETH. | "Recovered Info" section is visible. |
| 2 | **Native Send:**<br>To: (Use a random address)<br>Amount: `0.0001` | Click **Sign & Send**. Status changes to "Processing...".<br>After ~15s: "✅ Confirmed!" with Etherscan link. |
| 3 | **Click Etherscan Link.** | Opens new tab. Verify Status is "Success" and Value is `0.0001 ETH`. |
| 4 | **Error Handling:**<br>Clear the loaded wallet (or open Incognito). Try to send. | Alert shows "Please load your wallet phrase first!". |

---

## 📋 Test Case 6: QR Code Functionality
**Objective:** Verify Camera integration and QR Generation.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | **Receive:** Ensure address input is filled.<br>Click **"⬇️ QR"** button. | Modal opens showing a QR code. Text below matches the input address. |
| 2 | **Scan (Setup):** Open app on **Mobile** (or Laptop with Webcam). | Click the **Camera Icon** inside the "Send To" input. |
| 3 | **Permission:** Browser asks for Camera access. | Click "Allow". Camera viewfinder appears in modal. |
| 4 | **Scan (Action):** Point camera at a valid ETH QR code. | Camera freezes/stops. Modal closes. **Recipient Address** input is filled with the scanned address. |

---

## 🐛 Common Debugging Checks
If a test fails, check the **Browser Console (F12)** for these errors:

* `INSUFFICIENT_FUNDS`: You are trying to send more ETH than you have.
* `Invalid API Key` / `429 Too Many Requests`: (Only if History feature was enabled, N/A for this version).
* `Mixed Content`: Trying to access Camera on `http://` instead of `https://`.
* `Provider Error`: Internet connection lost or RPC node is down.
