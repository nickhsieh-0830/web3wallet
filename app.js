// Global State
let selectedAsset = null;
let html5QrCode = null;

// --- STARTUP ---
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

// --- SETTINGS ---
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
    const select = document.getElementById('assetSelect');
    const assets = CONFIG.assets[networkKey];
    select.innerHTML = "";
    assets.forEach((asset, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.innerText = `${asset.symbol}`;
        select.appendChild(option);
    });
    selectedAsset = assets[0];
}

// --- ACTIONS ---
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    const balanceText = document.getElementById('balanceText');
    if (!ethers.isAddress(address)) return alert("Invalid Address");
    balanceText.innerText = "Syncing...";
    try {
        const balance = await walletService.getBalance(address, selectedAsset);
        const displayBal = parseFloat(balance).toFixed(4);
        balanceText.innerText = `${displayBal} ${selectedAsset.symbol}`;
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
    status.innerText = "Processing...";

    try {
        walletService.connectWallet(phrase);
        const tx = await walletService.sendTransaction(to, amount, selectedAsset);
        const explorer = walletService.currentNetwork.explorer;
        status.innerHTML = `Hash: <a href="${explorer}/tx/${tx.hash}" target="_blank">View</a>`;
        await tx.wait();
        status.innerHTML += " ✅ Confirmed!";
        status.style.color = "#34a853";
    } catch (err) {
        console.error(err);
        status.style.color = "#d93025";
        status.innerText = "Failed: " + (err.shortMessage || "Error");
    }
});

// --- WALLET MANAGEMENT ---
document.getElementById('genBtn').addEventListener('click', () => {
    const w = ethers.Wallet.createRandom();
    document.getElementById('walletInfo').style.display = 'block';
    document.getElementById('phraseText').value = w.mnemonic.phrase;
    document.getElementById('addressText').innerText = w.address;
    
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
        document.getElementById('recoverStatus').innerText = "✅ Loaded";
        document.getElementById('recoverStatus').style.color = "#34a853";
    } catch (e) {
        document.getElementById('recoverStatus').innerText = "❌ Invalid";
        document.getElementById('recoverStatus').style.color = "#d93025";
    }
});

document.getElementById('toggleReveal').addEventListener('change', (e) => {
    document.getElementById('phraseText').type = e.target.checked ? 'text' : 'password';
});

// 1. Copy Secret Phrase (New Wallet)
document.getElementById('copyBtn').addEventListener('click', () => {
    const phrase = document.getElementById('phraseText').value;
    if (!phrase) return;
    navigator.clipboard.writeText(phrase).then(() => {
        const msg = document.getElementById('copyMsg');
        msg.style.display = "inline";
        setTimeout(() => msg.style.display = "none", 2000);
    });
});

// 2. Copy Active Address (Loaded Wallet)
document.getElementById('copyRecoverBtn').addEventListener('click', () => {
    // Note: We get .innerText from the code element
    const addr = document.getElementById('recoveredAddress').innerText;
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => {
        const msg = document.getElementById('copyRecoverMsg');
        msg.style.display = "inline";
        setTimeout(() => msg.style.display = "none", 2000);
    });
});

// --- QR CODES ---
document.getElementById('receiveBtn').addEventListener('click', () => {
    const address = document.getElementById('addressInput').value || localStorage.getItem('userAddress');
    if (!address) return alert("No address found.");
    
    document.getElementById('qrModal').style.display = 'flex';
    document.getElementById('qrcode').innerHTML = "";
    document.getElementById('qrAddressText').innerText = address;
    
    new QRCode(document.getElementById("qrcode"), {
        text: address, width: 180, height: 180, correctLevel : QRCode.CorrectLevel.H
    });
});

document.getElementById('scanBtn').addEventListener('click', () => {
    document.getElementById('scanModal').style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
        (decodedText) => {
            const match = decodedText.match(/(0x[a-fA-F0-9]{40})/i);
            if (match) {
                document.getElementById('sendTo').value = match[0];
                stopScanner();
            }
        },
        () => {}
    );
});

window.stopScanner = () => {
    if (html5QrCode) html5QrCode.stop().then(() => {
        document.getElementById('scanModal').style.display = 'none';
        html5QrCode.clear();
    });
};
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.onclick = (e) => { if(e.target.className === 'modal') { e.target.style.display='none'; if(e.target.id==='scanModal') stopScanner(); }};
