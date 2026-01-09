// app.js

// 1. State
let selectedAsset = null; // Will store the currently selected asset object

// 2. Startup Logic
window.addEventListener('load', () => {
    // Initialize Network (Default to Sepolia)
    walletService.initProvider('sepolia');
    updateAssetDropdown('sepolia');
    
    // Check local storage
    const savedAddress = localStorage.getItem('userAddress');
    if (savedAddress) {
        document.getElementById('addressInput').value = savedAddress;
        document.getElementById('recoveredInfo').style.display = 'block';
        document.getElementById('recoveredAddress').innerText = savedAddress;
    }
});

// 3. Network Switcher Logic
document.getElementById('networkSelect').addEventListener('change', (e) => {
    const netKey = e.target.value;
    
    // Update Service
    walletService.initProvider(netKey);
    
    // Update UI (Asset List)
    updateAssetDropdown(netKey);
    
    // Reset Display
    document.getElementById('balanceText').innerText = "---";
});

// Helper: Populate Asset Dropdown dynamically
function updateAssetDropdown(networkKey) {
    const assetSelect = document.getElementById('assetSelect');
    const assets = CONFIG.assets[networkKey];
    
    assetSelect.innerHTML = ""; // Clear old options
    
    assets.forEach((asset, index) => {
        const option = document.createElement("option");
        option.value = index; // We use the index to find the object later
        option.innerText = `${asset.symbol} (${asset.name})`;
        assetSelect.appendChild(option);
    });

    // Select first asset by default
    selectedAsset = assets[0];
}

// Update 'selectedAsset' when user changes dropdown
document.getElementById('assetSelect').addEventListener('change', (e) => {
    const netKey = document.getElementById('networkSelect').value;
    const index = e.target.value;
    selectedAsset = CONFIG.assets[netKey][index];
    
    // Reset balance text to prompt a re-check
    document.getElementById('balanceText').innerText = "---";
});

// 4. Check Balance Logic
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    const balanceText = document.getElementById('balanceText');
    
    if (!ethers.isAddress(address)) return alert("Invalid Address");

    balanceText.innerText = "Syncing...";

    try {
        // Use the Service to get balance (Native OR Token)
        const balance = await walletService.getBalance(address, selectedAsset);
        balanceText.innerText = `${balance} ${selectedAsset.symbol}`;
    } catch (err) {
        console.error(err);
        balanceText.innerText = "Error (See Console)";
    }
});

// 5. Send Logic
document.getElementById('sendBtn').addEventListener('click', async () => {
    const to = document.getElementById('sendTo').value.trim();
    const amount = document.getElementById('sendAmount').value;
    const phrase = document.getElementById('recoverInput').value.trim() || 
                   document.getElementById('phraseText').value;
    const status = document.getElementById('txStatus');

    if (!phrase) return alert("Load wallet first!");

    status.style.color = "#1a73e8";
    status.innerText = "Initiating Transaction...";

    try {
        // 1. Connect the wallet
        walletService.connectWallet(phrase);

        // 2. Send (Service handles the complex math)
        const tx = await walletService.sendTransaction(to, amount, selectedAsset);

        // 3. Update UI
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

// 6. Wallet Generation & Recovery (Standard UI logic)
document.getElementById('genBtn').addEventListener('click', () => {
    const w = ethers.Wallet.createRandom();
    document.getElementById('walletInfo').style.display = 'block';
    document.getElementById('phraseText').value = w.mnemonic.phrase;
    document.getElementById('addressText').innerText = w.address;
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
    } catch (e) {
        document.getElementById('recoverStatus').innerText = "❌ Invalid Phrase";
    }
});

// ==========================================
// QR CODE LOGIC
// ==========================================
// --- 1. RECEIVE (GENERATE) ---
document.getElementById('receiveBtn').addEventListener('click', () => {
    const address = localStorage.getItem('userAddress');
    if (!address) return alert("Please generate or load a wallet first!");

    // Show Modal
    document.getElementById('qrModal').style.display = 'flex';
    document.getElementById('qrAddressText').innerText = address;
    
    // Clear previous QR if any
    document.getElementById('qrcode').innerHTML = "";

    // Generate New QR
    new QRCode(document.getElementById("qrcode"), {
        text: address,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H // High error correction
    });
});
// --- 2. SEND (SCANNER) ---
let html5QrCode; // Global scanner instance

document.getElementById('scanBtn').addEventListener('click', () => {
    // Show Modal
    document.getElementById('scanModal').style.display = 'flex';
    
    // Initialize Scanner
    html5QrCode = new Html5Qrcode("reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
        { facingMode: "environment" }, // Use Back Camera
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        document.getElementById('scanStatus').innerText = "Error starting camera: " + err;
    });
});
function onScanSuccess(decodedText, decodedResult) {
    // 1. Check if it looks like an Ethereum address
    // Matches 0x followed by 40 hex characters
    const ethRegex = /(0x[a-fA-F0-9]{40})/;
    const match = decodedText.match(ethRegex);

    if (match) {
        // Success!
        const address = match[0];
        document.getElementById('sendTo').value = address;
        
        // Stop camera and close modal
        stopScanner();
        
        // Visual feedback
        alert("Address Found: " + address);
    } else {
        console.warn("QR code found, but not an ETH address:", decodedText);
    }
}

function onScanFailure(error) {
    // Often triggers when it sees a QR but can't read it yet. Ignore mostly.
    // console.warn(`Code scan error = ${error}`);
}
// --- UTILITY: CLOSE MODALS ---
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
window.stopScanner = function() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanModal').style.display = 'none';
            html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
    } else {
        document.getElementById('scanModal').style.display = 'none';
    }
}
// Close modal if user clicks outside the box
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = "none";
        if (event.target.id === 'scanModal') stopScanner();
    }
}
