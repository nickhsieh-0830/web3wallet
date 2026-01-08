// services.js

class WalletService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.currentNetwork = null;
    }

    // Initialize the provider for a specific network
    initProvider(networkKey) {
        this.currentNetwork = CONFIG.networks[networkKey];
        this.provider = new ethers.JsonRpcProvider(this.currentNetwork.rpc);
        return this.provider;
    }

    // Connect a wallet (Phrase -> Signer)
    connectWallet(phrase) {
        if (!phrase) throw new Error("No phrase provided");
        const wallet = ethers.HDNodeWallet.fromPhrase(phrase);
        this.signer = wallet.connect(this.provider);
        return this.signer;
    }

    // GET BALANCE (Smart: Handles Native vs ERC20)
    async getBalance(address, asset) {
        if (!this.provider) throw new Error("Provider not ready");

        let rawBalance;

        if (asset.type === "NATIVE") {
            // Strategy A: Ask the node for ETH balance
            rawBalance = await this.provider.getBalance(address);
        } else {
            // Strategy B: Ask the Smart Contract for Token balance
            const contract = new ethers.Contract(asset.address, ERC20_ABI, this.provider);
            rawBalance = await contract.balanceOf(address);
        }

        // Format the human-readable number (Handle 18 vs 6 decimals!)
        return ethers.formatUnits(rawBalance, asset.decimals);
    }

    // SEND ASSET (Smart: Handles Native vs ERC20)
    async sendTransaction(to, amount, asset) {
        if (!this.signer) throw new Error("Wallet not loaded");

        const amountWei = ethers.parseUnits(amount.toString(), asset.decimals);

        if (asset.type === "NATIVE") {
            // Send ETH
            const tx = await this.signer.sendTransaction({
                to: to,
                value: amountWei
            });
            return tx;
        } else {
            // Send Token
            const contract = new ethers.Contract(asset.address, ERC20_ABI, this.signer);
            const tx = await contract.transfer(to, amountWei);
            return tx;
        }
    }
}

// Create a global instance to use in app.js
const walletService = new WalletService();
