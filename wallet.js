// Network status check
async function updateNetworkStatus(){
    const light=document.getElementById("statusLight");
    const text=document.getElementById("statusText");
    try {
        const blockNum=await provider.getBlockNumber();
        light.style.background="#34a853";//Green
        text.innerText=`Connected (Block: ${blockNum})`;
    } catch (err) {
        light.style.background = "#d93025";//Red
        text.innerText="Node Offline";
    }
}
updateNetworkStatus();// Initial check
setInterval(updateNetworkStatus,10000); //check network status every 10 secs.
const NETWORKS={
    sepolia:{
        name: "Sepolia Testnet",
        rpc: "https://ethereum-sepolia-rpc.publicnode.com",
        explorerApi: "https://api-sepolia.etherscan.io/api",//Testnet API
        symbol: "SEP"
    },
    mainnet: {
        name: "Etheresum Mainnet",
        rpc: "https://ethereum-rpc.publicnode.com",
        explorerApi: "https://api.etherscan.io/api", // Mainnet API
        symbol: "ETH"
    }
};

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
let provider=new ethers.JsonRpcProvider(document.getElementById('networkSelect').value);
const networkSelect=document.getElementById('networkSelect');
const networkWarning=document.getElementById('networkWarning');
networkSelect.addEventListener('change',()=>{
    provider=new ethers.JsonRpcProvider(networkSelect.value);
    if(networkSelect.value.includes("sepolia")){
        networkWarning.style.display="none";
    } else {
        networkWarning.style.display="block";
    }
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
    fetchHistory(address);
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

//checkHistory
async function fetchHistory(address) {
    const list = document.getElementById('historyList');
    const apiBase = currentNetwork.explorerApi;
    const apiKey = 'YOUR_ETHERSCAN_API_KEY'; // ⚠️ Make sure this is real!

    list.innerHTML = "Loading history...";

    try {
        // 1. Fetch Normal Transactions
        const normalUrl = `${apiBase}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        
        // 2. Fetch Internal Transactions (Faucets often live here)
        const internalUrl = `${apiBase}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

        // Run both requests at the same time
        const [normalRes, internalRes] = await Promise.all([
            fetch(normalUrl).then(r => r.json()),
            fetch(internalUrl).then(r => r.json())
        ]);

        // 3. Combine the results
        let allTxs = [];
        if (normalRes.status === "1") allTxs = allTxs.concat(normalRes.result);
        if (internalRes.status === "1") allTxs = allTxs.concat(internalRes.result);

        // 4. Sort by time (Newest first)
        allTxs.sort((a, b) => b.timeStamp - a.timeStamp);

        if (allTxs.length > 0) {
            list.innerHTML = allTxs.slice(0, 5).map(tx => {
                const isSent = tx.from.toLowerCase() === address.toLowerCase();
                // Internal txs don't have 'hash', they share the parent's hash
                const hash = tx.hash || tx.transactionHash; 
                
                return `
                <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                    <span style="color: ${isSent ? '#d93025' : '#34a853'}">
                        ${isSent ? '📤 Sent' : '📥 Received'} 
                        ${tx.contractAddress ? '(Internal)' : ''}
                    </span>
                    <br><strong>${ethers.formatEther(tx.value)} ${currentNetwork.symbol}</strong>
                    <br><small style="color:gray;">${new Date(tx.timeStamp * 1000).toLocaleString()}</small>
                    <br><small><a href="${currentNetwork.explorer}/tx/${hash}" target="_blank">View on Explorer</a></small>
                </div>
            `}).join('');
        } else {
            list.innerHTML = "<p style='color:gray;'>No activity found.</p>";
        }
    } catch (err) {
        console.error(err);
        list.innerHTML = "Error loading history (Check Console)";
    }
}
