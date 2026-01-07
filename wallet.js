// 1. Setup Connection to Sepolia (Public Node)
const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

// --- UTILITY: REVEAL & COPY ---
const toggleReveal = document.getElementById('toggleReveal');
const phraseInput = document.getElementById('phraseText');
const copyBtn = document.getElementById('copyBtn');

toggleReveal.addEventListener('change', () => {
  phraseInput.type = toggleReveal.checked ? 'text' : 'password';
});

copyBtn.addEventListener('click', () => {
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
    balanceText.innerText = "Connection Error";
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
const recoverBtn = document.getElementById('recoverBtn');
const recoverStatus = document.getElementById('recoverStatus');

recoverBtn.addEventListener('click', () => {
  const phrase = document.getElementById('recoverInput').value.trim();
  
  // Clear previous status
  recoverStatus.innerText = "";
  recoverStatus.style.color = "#333";

  try {
    const recoveredWallet = ethers.HDNodeWallet.fromPhrase(phrase);
    
    // Show success message on the page
    recoverStatus.innerText = "✅ Wallet loaded successfully!";
    recoverStatus.style.color = "#34a853"; // Green

    // Show the address details
    document.getElementById('recoveredInfo').style.display = "block";
    document.getElementById('recoveredAddress').innerText = recoveredWallet.address;
    
  } catch (err) {
    // Show error message on the page
    recoverStatus.innerText = "❌ Invalid Phrase. Please check your words.";
    recoverStatus.style.color = "#d93025"; // Red
    document.getElementById('recoveredInfo').style.display = "none";
  }
});

// --- LOGIC: SEND ---
document.getElementById('sendBtn').addEventListener('click', async () => {
  const toAddress = document.getElementById('sendTo').value.trim();
  const amount = document.getElementById('sendAmount').value;
  // Get phrase from whichever field is filled
  const phrase = document.getElementById('recoverInput').value.trim() || 
                 document.getElementById('phraseText').value;
  const status = document.getElementById('txStatus');

  if (!phrase) return alert("You must generate or load a wallet first!");
  if (!ethers.isAddress(toAddress)) return alert("Invalid recipient address");

  status.style.color = "#1a73e8";
  status.innerText = "Authorizing transaction...";

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
    status.innerHTML += "<br>✅ Confirmed by Network!";
  } catch (err) {
    status.style.color = "#d93025";
    status.innerText = "Failed: " + (err.shortMessage || "Low balance or network error");
  }
});
