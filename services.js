class WalletService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.currentNetwork = null;
    }

    // 1. Initialize Network
    initProvider(networkKey) {
        this.currentNetwork = CONFIG.networks[networkKey];
        this.provider = new ethers.JsonRpcProvider(this.currentNetwork.rpc);
    }

    // 2. Connect Wallet (from Phrase)
    connectWallet(phrase) {
        if (!phrase) throw new Error("No phrase provided");
        const wallet = ethers.HDNodeWallet.fromPhrase(phrase);
        this.signer = wallet.connect(this.provider);
        return this.signer; // Return signer for UI to use address
    }

    // 3. Get Balance (Handles both Native & Tokens)
    async getBalance(address, asset) {
        if (!this.provider) throw new Error("Provider not ready");
        let rawBalance;

        if (asset.type === "NATIVE") {
            rawBalance = await this.provider.getBalance(address);
        } else {
            const contract = new ethers.Contract(asset.address, ERC20_ABI, this.provider);
            rawBalance = await contract.balanceOf(address);
        }

        return ethers.formatUnits(rawBalance, asset.decimals);
    }

    // 4. Send Transaction (Handles both Native & Tokens)
    async sendTransaction(to, amount, asset) {
        if (!this.signer) throw new Error("Wallet not loaded");

        // Convert human number (0.1) to blockchain number (100000...)
        const amountWei = ethers.parseUnits(amount.toString(), asset.decimals);

        if (asset.type === "NATIVE") {
            // Standard ETH Send
            return await this.signer.sendTransaction({
                to: to,
                value: amountWei
            });
        } else {
            // ERC-20 Token Send
            const contract = new ethers.Contract(asset.address, ERC20_ABI, this.signer);
            return await contract.transfer(to, amountWei);
        }
    }
}

// Create a global instance
const walletService = new WalletService();
