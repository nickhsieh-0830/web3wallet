// ==========================================
// 1. STATE & STARTUP
// ==========================================
let selectedAsset = null;
let html5QrCode = null;

window.addEventListener('load', () => {
    walletService.initProvider('sepolia');
    updateAssetDropdown('sepolia');
    
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
        document.getElementById('addressInput').value = savedAddress;
        document.getElementById('recoveredInfo').style.display = 'block';
        document.getElementById('recoveredAddress').innerText = savedAddress;
    }
});

// ==========================================
// 2. SETTINGS (NETWORK & ASSETS)
// ==========================================
document.getElementById('networkSelect').addEventListener('change', (e) => {
    const netKey = e.target.value;
    walletService.initProvider(netKey);
    updateAssetDropdown(netKey);
    document.getElementById('balanceText').innerText = "---";
});

document.getElementById('assetSelect').addEventListener('change', (e) => {
    const netKey = document.getElementById('networkSelect').value;
    const index = e.target.value;
    selectedAsset = CONFIG.assets[netKey][index];
    document.getElementById('balanceText').innerText = "---";
});

function updateAssetDropdown(networkKey) {
    const assetSelect = document.getElementById('assetSelect');
    const assets = CONFIG.assets[networkKey];
    assetSelect.innerHTML = ""; 
    assets.forEach((asset, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.innerText = `${asset.symbol} (${asset.name})`;
        assetSelect.appendChild(option);
    });
    selectedAsset = assets[0];
}

// ==========================================
// 3. CORE FUNCTIONS (Balance, Send)
// ==========================================
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    const balanceText = document.getElementById('balanceText');
    if (!ethers.isAddress(address)) return alert("Invalid Address");
    balanceText.innerText = "Syncing...";
    try {
        const balance = await walletService.getBalance(address, selectedAsset);
        balanceText.innerText = `${balance} ${selectedAsset.symbol}`;
    } catch (err) {
        console.error(err);
        balanceText.innerText = "Error";
    }
});

document.getElementById('sendBtn').addEventListener('click', async () => {
    const to = document.getElementById('sendTo').value.trim();
    const amount = document.getElementById('sendAmount').value;
    const phrase = document.getElementById('recoverInput').value.trim() || 
                   document.getElementById('phraseText').value;
    const status = document.getElementById('txStatus');

    if (!phrase) return alert("Please load your wallet phrase first!");

    status.style.color = "#1a73e8";
    status.innerText = "Initiating Transaction...";

    try {
        walletService.connectWallet(phrase);
        const tx = await walletService.sendTransaction(to, amount, selectedAsset);
        const explorer = walletService.currentNetwork.explorer;
        status.innerHTML = `Hash: <a href="${explorer}/tx/${tx.hash}" target="_blank">View Transaction</a>`;
        await tx.wait();
        status.innerHTML += "<br>✅ Confirmed!";
        status.style.color = "#34a853";
    } catch (err) {
        console.error(err);
        status.style.color = "#d93025";
        status.innerText = "Failed: " + (err.shortMessage || err.message);
    }
});

// ==========================================
// 4. WALLET MANAGEMENT (FIXED)
// ==========================================
document.getElementById('genBtn').addEventListener('click', () => {
    const w = ethers.Wallet.createRandom();
    document.getElementById('walletInfo').style.display = 'block';
    document.getElementById('phraseText').value = w.mnemonic.phrase;
    document.getElementById('addressText').innerText = w.address;
    
    // Reset Reveal Checkbox
    document.getElementById('phraseText').type = "password";
    document.getElementById('toggleReveal').checked = false;
    
    localStorage.setItem('userAddress', w.address);
});

document.getElementById('recoverBtn').addEventListener('click', () => {
    const p = document.getElementById('recoverInput').value.trim();
    try {
        const w = ethers.HDNodeWallet.fromPhrase(p);
        document.getElementById('recoveredInfo').style.display = 'block';
        document.getElementById('recoveredAddress').innerText = w.address;
        localStorage.setItem('userAddress', w.address);
        document.getElementById('recoverStatus').innerText = "✅ Loaded!";
        document.getElementById('recoverStatus').style.color = "#34a853";
    } catch (e) {
        document.getElementById('recoverStatus').innerText = "❌ Invalid Phrase";
        document.getElementById('recoverStatus').style.color = "#d93025";
    }
});

// --- RESTORED LOGIC FOR COPY & REVEAL ---
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

// ==========================================
// 5. QR CODE LOGIC
// ==========================================
document.getElementById('receiveBtn').addEventListener('click', () => {
    const inputVal = document.getElementById('addressInput').value.trim();
    const memoryVal = localStorage.getItem('userAddress');
    const address = inputVal || memoryVal;

    if (!address || !ethers.isAddress(address)) return alert("No valid address found!");

    document.getElementById('qrModal').style.display = 'flex';
    document.getElementById('qrAddressText').innerText = address;
    document.getElementById('qrcode').innerHTML = ""; 

    new QRCode(document.getElementById("qrcode"), {
        text: address,
        width: 180, height: 180,
        correctLevel : QRCode.CorrectLevel.H
    });
});

document.getElementById('scanBtn').addEventListener('click', () => {
    document.getElementById('scanModal').style.display = 'flex';
    document.getElementById('scanStatus').innerText = "Requesting Camera...";

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
            const ethRegex = /(0x[a-fA-F0-9]{40})/i;
            const match = decodedText.match(ethRegex);
            if (match) {
                document.getElementById('sendTo').value = match[0];
                stopScanner();
            }
        },
        (error) => {}
    ).catch(err => {
        document.getElementById('scanStatus').innerText = "Error: " + err;
    });
});

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.stopScanner = function() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanModal').style.display = 'none';
            html5QrCode.clear();
        }).catch(err => console.error(err));
    } else {
        document.getElementById('scanModal').style.display = 'none';
    }
}

window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = "none";
        if (event.target.id === 'scanModal') stopScanner();
    }
}
