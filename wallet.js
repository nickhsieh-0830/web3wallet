// Once page load, check if saved address exist locally
window.addEventListener('load',() => {
    const savedAddress=localStorage.getItem('userAddress');
    if(savedAddress){
        document.getElementById('addressInput').value=savedAddress;
        document.getElementById('recoveredInfo').style.display="block";
        document.getElementById('recoveredAddress').innerText=savedAddress;
        document.getElementById('checkBtn').click();//check balance automatically
    }
    }
);

// Connection Setup: dynamic provider
let provider=new thers.KsonRpcProvider(document.getElementById('networkSelect').value);
const networkSelect document.getElementById('networkSelect');
const networkWarning document.getElementById('networkWarning');
networkSelect.addEventListener('change',()=>{
    provider=new ethers.JsonRpcProvider(networkSelect.value);
    if(networkSelect.value.includes("sepolia")){
        networkWarning.style.display="none";
    } else {
        networkWarning.style.display="block";
    }
    //Check balance after switch network
    document.getElementById('checkBtn').click();
});
//this is test provider: const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

// --- UTILITY: REVEAL & COPY ---
const toggleReveal = document.getElementById('toggleReveal');
const phraseInput = document.getElementById('phraseText');
const copyBtn = document.getElementById('copyBtn');

toggleReveal?.addEventListener('change', () => {
    phraseInput.type = toggleReveal.checked ? 'text' : 'password';
});

copyBtn?.addEventListener('click', () => {
    if (!phraseInput.value) return;
    navigator.clipboard.writeText(phraseInput.value).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "Copied!";
        setTimeout(() => copyBtn.innerText = originalText, 2000);
    });
});

// --- LOGIC: CHECK BALANCE ---
document.getElementById('checkBtn').addEventListener('click', async () => {
    const address = document.getElementById('addressInput').value.trim();
    const balanceText = document.getElementById('balanceText');
    
    if (!ethers.isAddress(address)) return alert("Invalid Address");
    
    balanceText.innerText = "Syncing...";
    try {
        const balanceWei = await provider.getBalance(address);
        balanceText.innerText = ethers.formatEther(balanceWei);
    } catch (err) {
        balanceText.innerText = "Error";
    }
});

// --- LOGIC: GENERATE ---
document.getElementById('genBtn').addEventListener('click', () => {
    const randomWallet = ethers.Wallet.createRandom();
    document.getElementById('walletInfo').style.display = "block";
    document.getElementById('phraseText').value = randomWallet.mnemonic.phrase;
    document.getElementById('addressText').innerText = randomWallet.address;
    
    // Safety reset
    toggleReveal.checked = false;
    phraseInput.type = 'password';
});

// --- LOGIC: RECOVER ---
document.getElementById('recoverBtn').addEventListener('click', () => {
    const phrase = document.getElementById('recoverInput').value.trim();
    const status = document.getElementById('recoverStatus');
    
    status.innerText = ""; // Clear status

    try {
        const recoveredWallet = ethers.HDNodeWallet.fromPhrase(phrase);
        
        status.innerText = "✅ Wallet loaded successfully!";
        status.style.color = "#34a853";
        
        document.getElementById('recoveredInfo').style.display = "block";
        document.getElementById('recoveredAddress').innerText = recoveredWallet.address;
        localStorage.setItem('userAddress',recoveredWallet.address);//save address in browser's memory
    } catch (err) {
        status.innerText = "❌ Invalid Phrase. Check your words.";
        status.style.color = "#d93025";
        document.getElementById('recoveredInfo').style.display = "none";
    }
});

// --- LOGIC: SEND ---
document.getElementById('sendBtn').addEventListener('click', async () => {
    const toAddress = document.getElementById('sendTo').value.trim();
    const amount = document.getElementById('sendAmount').value;
    const phrase = document.getElementById('recoverInput').value.trim() || 
                   document.getElementById('phraseText').value;
    const status = document.getElementById('txStatus');

    if (!phrase) return alert("Please generate or load a wallet first!");
    if (!ethers.isAddress(toAddress)) return alert("Invalid recipient address");

    status.style.color = "#1a73e8";
    status.innerText = "Signing & Sending...";

    try {
        const wallet = ethers.HDNodeWallet.fromPhrase(phrase);
        const signer = wallet.connect(provider);

        const tx = await signer.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(amount)
        });

        status.innerHTML = `Hash: <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">${tx.hash.substring(0,20)}...</a>`;
        
        await tx.wait();
        status.style.color = "#34a853";
        status.innerHTML += "<br>✅ Confirmed on Blockchain!";
    } catch (err) {
        status.style.color = "#d93025";
        status.innerText = "Failed: " + (err.shortMessage || "Network error");
    }
});

// --- LOGIC: CLEAR DATA ---
document.getElementById('clearDataBtn').addEventListener('click',() => {
    if(confirm("This will clear your saved address from this browser. You funds remain safe on the blockchain. Continue?")){
        localStorage.removeItem('userAddress');
        //reload browser
        location.reload();
    }
});
