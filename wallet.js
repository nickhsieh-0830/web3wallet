// ==========================================
// 1. CONFIGURATION
// ==========================================
const NETWORKS = {
    sepolia: {
        chainId: 11155111,
        name: "Sepolia Testnet",
        rpc: "https://ethereum-sepolia-rpc.publicnode.com",
        explorer: "https://sepolia.etherscan.io",
        symbol: "SEP"
    },
    mainnet: {
        chainId: 1,
        name: "Ethereum Mainnet",
        rpc: "https://ethereum-rpc.publicnode.com",
        explorer: "https://etherscan.io",
        symbol: "ETH"
    }
};

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
let currentNetwork = NETWORKS.sepolia;
let provider = new ethers.JsonRpcProvider(currentNetwork.rpc);

// ==========================================
// 3. UI EVENT LISTENERS
// ==========================================

// --- NETWORK SWITCHER ---
const networkSelect = document.getElementById('networkSelect');

if (networkSelect) {
    networkSelect.addEventListener('change', () => {
        const selectedValue = networkSelect.value;
        
        if (selectedValue.includes("sepolia")) {
            currentNetwork = NETWORKS.sepolia;
        } else {
            currentNetwork = NETWORKS.mainnet;
        }

        // Re-connect to the new network
        provider = new ethers.JsonRpcProvider(currentNetwork.rpc);
        
        // Reset Balance Display
        document.getElementById('balanceText').innerText = "---";
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

// --- LOGIC: CHECK BALANCE ---
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    const balanceText = document.getElementById('balanceText');
    
    if (!ethers.isAddress(address)) return alert("Invalid Address");
    
    balanceText.innerText = "Syncing...";
    
    try {
        const balanceWei = await provider.getBalance(address);
        balanceText.innerText = `${ethers.formatEther(balanceWei)} ${currentNetwork.symbol}`;
    } catch (err) {
        console.error("Balance Error:", err);
        balanceText.innerText = "Error";
    }
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
        // Optionally auto-check balance
        // document.getElementById('checkBtn').click(); 
    }
});
