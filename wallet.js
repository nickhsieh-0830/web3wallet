// ==========================================
// 1. CONFIGURATION (The Data Layer)
// ==========================================
const NETWORKS = {
    sepolia: {
        chainId: 11155111,
        name: "Sepolia Testnet",
        rpc: "https://ethereum-sepolia-rpc.publicnode.com",
        explorerApi: "https://api-sepolia.etherscan.io/api",
        explorer: "https://sepolia.etherscan.io",
        symbol: "SEP"
    },
    mainnet: {
        chainId: 1,
        name: "Ethereum Mainnet",
        rpc: "https://ethereum-rpc.publicnode.com",
        explorerApi: "https://api.etherscan.io/api",
        explorer: "https://etherscan.io",
        symbol: "ETH"
    }
};

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
// We define currentNetwork here so it is available globally
let currentNetwork = NETWORKS.sepolia;
let provider = new ethers.JsonRpcProvider(currentNetwork.rpc);

// ==========================================
// 3. UI EVENT LISTENERS
// ==========================================

// --- NETWORK SWITCHER ---
const networkSelect = document.getElementById('networkSelect');

// Only run this logic if the dropdown exists in your HTML
if (networkSelect) {
    networkSelect.addEventListener('change', () => {
        const selectedValue = networkSelect.value;
        
        // Logic to switch network based on the dropdown text/value
        if (selectedValue.includes("sepolia") || selectedValue.includes("Sepolia")) {
            currentNetwork = NETWORKS.sepolia;
        } else {
            currentNetwork = NETWORKS.mainnet;
        }

        // Re-connect to the new network
        provider = new ethers.JsonRpcProvider(currentNetwork.rpc);
        
        // Reset UI to avoid confusion
        document.getElementById('balanceText').innerText = "---";
        document.getElementById('historyList').innerHTML = "<p style='color:gray'>Network changed. Click 'Check Balance' to update.</p>"; 
    });
}

// --- UTILITY: REVEAL & COPY ---
const toggleReveal = document.getElementById('toggleReveal');
const phraseInput = document.getElementById('phraseText');
const copyBtn = document.getElementById('copyBtn');

if (toggleReveal) {
    toggleReveal.addEventListener('change', () => {
        phraseInput.type = toggleReveal.checked ? 'text' : 'password';
    });
}

if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        if (!phraseInput.value) return;
        navigator.clipboard.writeText(phraseInput.value).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied!";
            setTimeout(() => copyBtn.innerText = originalText, 2000);
        });
    });
}

// --- LOGIC: CHECK BALANCE & HISTORY ---
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    const balanceText = document.getElementById('balanceText');
    
    if (!ethers.isAddress(address)) return alert("Invalid Address");
    
    balanceText.innerText = "Syncing...";
    
    // 1. Check Balance
    try {
        const balanceWei = await provider.getBalance(address);
        balanceText.innerText = `${ethers.formatEther(balanceWei)} ${currentNetwork.symbol}`;
    } catch (err) {
        console.error("Balance Error:", err);
        balanceText.innerText = "Error";
    }

    // 2. Fetch History (using the global currentNetwork)
    fetchHistory(address);
});

// --- LOGIC: GENERATE WALLET ---
document.getElementById('genBtn').addEventListener('click', () => {
    const randomWallet = ethers.Wallet.createRandom();
    document.getElementById('walletInfo').style.display = "block";
    document.getElementById('phraseText').value = randomWallet.mnemonic.phrase;
    document.getElementById('addressText').innerText = randomWallet.address;
    
    localStorage.setItem('userAddress', randomWallet.address);
    
    if (toggleReveal) toggleReveal.checked = false;
    phraseInput.type = 'password';
});

// --- LOGIC: RECOVER WALLET ---
document.getElementById('recoverBtn').addEventListener('click', () => {
    const phrase = document.getElementById('recoverInput').value.trim();
    const status = document.getElementById('recoverStatus');
    
    status.innerText = ""; 

    try {
        const recoveredWallet = ethers.HDNodeWallet.fromPhrase(phrase);
        
        status.innerText = "✅ Wallet loaded successfully!";
        status.style.color = "#34a853";
        
        document.getElementById('recoveredInfo').style.display = "block";
        document.getElementById('recoveredAddress').innerText = recoveredWallet.address;
        
        localStorage.setItem('userAddress', recoveredWallet.address);
        
    } catch (err) {
        status.innerText = "❌ Invalid Phrase.";
        status.style.color = "#d93025";
    }
});

// --- LOGIC: SEND TRANSACTION ---
document.getElementById('sendBtn').addEventListener('click', async () => {
    const toAddress = document.getElementById('sendTo').value.trim();
    const amount = document.getElementById('sendAmount').value;
    const phrase = document.getElementById('recoverInput').value.trim() || 
                   document.getElementById('phraseText').value;
    const status = document.getElementById('txStatus');

    if (!phrase) return alert("Please load your wallet first!");
    
    status.style.color = "#1a73e8";
    status.innerText = "Signing & Sending...";

    try {
        const wallet = ethers.HDNodeWallet.fromPhrase(phrase);
        const signer = wallet.connect(provider);

        const tx = await signer.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(amount)
        });

        status.innerHTML = `Hash: <a href="${currentNetwork.explorer}/tx/${tx.hash}" target="_blank">View Transaction</a>`;
        
        await tx.wait();
        status.style.color = "#34a853";
        status.innerHTML += "<br>✅ Confirmed!";
    } catch (err) {
        status.style.color = "#d93025";
        status.innerText = "Failed: " + (err.shortMessage || "Error");
    }
});

// --- LOGIC: CLEAR DATA ---
const clearBtn = document.getElementById('clearDataBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (confirm("Clear saved address and reset?")) {
            localStorage.removeItem('userAddress');
            location.reload();
        }
    });
}

// --- PERSISTENCE ---
window.addEventListener('load', () => {
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
        document.getElementById('addressInput').value = savedAddress;
        // Optionally auto-load balance
        // document.getElementById('checkBtn').click(); 
    }
});

// ==========================================
// 4. COMPLEX FUNCTIONS (History)
// ==========================================

async function fetchHistory(address) {
    const list = document.getElementById('historyList');
    
    // ✅ YOUR API KEY IS INTEGRATED HERE
    const apiKey = 'F1K8PWJSKMBM7J4QEE97WXZTEA95WSXQFW'; 
    const apiBase = currentNetwork.explorerApi;

    list.innerHTML = `<div style="text-align:center; padding: 10px; color: #666;">⏳ Scanning ${currentNetwork.name}...</div>`;

    try {
        // Define endpoints for Normal, Internal, and Token txs
        // We use 'currentNetwork.explorerApi' so it switches automatically
        const endpoints = [
            { type: 'Normal', url: `${apiBase}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}` },
            { type: 'Internal', url: `${apiBase}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}` },
            { type: 'Token',    url: `${apiBase}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}` }
        ];

        // Fetch all 3 sources in parallel
        const results = await Promise.all(
            endpoints.map(ep => fetch(ep.url).then(r => r.json()).then(data => ({ type: ep.type, data: data })))
        );

        let allTxs = [];
        results.forEach(res => {
            // "1" means Success in Etherscan API
            if (res.data.status === "1" && res.data.result.length > 0) {
                const labeledTxs = res.data.result.map(tx => ({...tx, category: res.type}));
                allTxs = allTxs.concat(labeledTxs);
            }
        });

        // Sort by newest first (timeStamp is a Unix string)
        allTxs.sort((a, b) => b.timeStamp - a.timeStamp);

        if (allTxs.length > 0) {
            list.innerHTML = allTxs.slice(0, 10).map(tx => {
                const isSent = tx.from.toLowerCase() === address.toLowerCase();
                const hash = tx.hash || tx.transactionHash; 
                
                let symbol = currentNetwork.symbol;
                let amount = tx.value;
                let displayAmount = "0.00";

                // Handle Token formatting (decimals)
                if (tx.category === 'Token') {
                    symbol = tx.tokenSymbol || "TOKEN";
                    const decimals = tx.tokenDecimal ? Number(tx.tokenDecimal) : 18;
                    displayAmount = (Number(amount) / Math.pow(10, decimals)).toFixed(2);
                } else {
                    // Handle ETH formatting
                    displayAmount = parseFloat(ethers.formatEther(amount)).toFixed(4);
                }

                return `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0; font-size: 0.85rem;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong style="color: ${isSent ? '#d93025' : '#34a853'}">
                            ${isSent ? '📤 Sent' : '📥 Received'}
                        </strong>
                        <span style="font-weight:600">${displayAmount} ${symbol}</span>
                    </div>
                    <div style="color:gray; font-size:0.75rem; margin-top:4px;">
                        ${new Date(tx.timeStamp * 1000).toLocaleDateString()} • ${tx.category}
                        <a href="${currentNetwork.explorer}/tx/${hash}" target="_blank" style="margin-left:5px; text-decoration:none; color:#1a73e8;">View ↗</a>
                    </div>
                </div>
            `}).join('');
        } else {
            list.innerHTML = `<div style="padding:15px; text-align:center; color:#888;">No transactions found on ${currentNetwork.name}.</div>`;
        }
    } catch (err) {
        console.error("History Error:", err);
        list.innerHTML = `<div style="color:#d93025; padding:10px;">Error loading history. See Console.</div>`;
    }
}
