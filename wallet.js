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
    const apiKey = 'YOUR_ETHERSCAN_API_KEY'; // ⚠️ Use your real key!

    list.innerHTML = `<div style="text-align:center; padding: 10px; color: #666;">⏳ Scanning Blockchain...</div>`;

    try {
        // 1. Define the 3 endpoints
        const endpoints = [
            { type: 'Normal', url: `${apiBase}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}` },
            { type: 'Internal', url: `${apiBase}?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}` },
            { type: 'Token',    url: `${apiBase}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}` }
        ];

        // 2. Run all 3 requests in parallel
        const results = await Promise.all(
            endpoints.map(ep => 
                fetch(ep.url)
                .then(r => r.json())
                .then(data => ({ type: ep.type, data: data }))
            )
        );

        // 3. Merge valid results
        let allTxs = [];
        results.forEach(res => {
            console.log(`🔍 ${res.type} Results:`, res.data); // DEBUG LOG
            
            if (res.data.status === "1" && res.data.result.length > 0) {
                // Label them so we know where they came from
                const labeledTxs = res.data.result.map(tx => ({...tx, category: res.type}));
                allTxs = allTxs.concat(labeledTxs);
            } else if (res.data.message === "NOTOK") {
                console.warn(`⚠️ API Error [${res.type}]: ${res.data.result}`);
            }
        });

        // 4. Sort by time (Newest first)
        allTxs.sort((a, b) => b.timeStamp - a.timeStamp);

        // 5. Render
        if (allTxs.length > 0) {
            list.innerHTML = allTxs.slice(0, 10).map(tx => {
                const isSent = tx.from.toLowerCase() === address.toLowerCase();
                const hash = tx.hash || tx.transactionHash; // Internal txs use 'transactionHash'
                
                // Determine symbol (ETH or Token Name)
                let symbol = currentNetwork.symbol;
                let amount = tx.value;
                
                // If it's a Token Transfer, use the Token Symbol and adjust decimals
                if (tx.category === 'Token') {
                    symbol = tx.tokenSymbol;
                    amount = tx.value; // Note: In a real app, you'd need to divide by tx.tokenDecimal
                }

                return `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-weight: bold; color: ${isSent ? '#d93025' : '#34a853'}">
                            ${isSent ? '📤 Sent' : '📥 Received'}
                        </span>
                        <span style="font-size: 0.75rem; background: #f1f3f4; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">
                            ${tx.category}
                        </span>
                        <div style="font-size: 0.75rem; color: #70757a; margin-top: 2px;">
                            ${new Date(tx.timeStamp * 1000).toLocaleDateString()}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600;">
                            ${tx.category === 'Token' ? 
                              (Number(amount) / Math.pow(10, tx.tokenDecimal)).toFixed(2) : 
                              parseFloat(ethers.formatEther(amount)).toFixed(4)} 
                            ${symbol}
                        </div>
                        <a href="${currentNetwork.explorer}/tx/${hash}" target="_blank" style="font-size: 0.75rem; color: #1a73e8; text-decoration: none;">View &nearr;</a>
                    </div>
                </div>
            `}).join('');
        } else {
            list.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #888;">
                    <p style="margin:0">No activity found.</p>
                    <small style="font-size:0.7em">(Checked Normal, Internal, and Token Txs)</small>
                </div>`;
        }
    } catch (err) {
        console.error("History Error:", err);
        list.innerHTML = `<div style="color: #d93025; padding: 10px;">Error loading history. Check Console.</div>`;
    }
}
