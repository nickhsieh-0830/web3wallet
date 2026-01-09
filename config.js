const CONFIG = {
    // 1. Define Networks
    networks: {
        sepolia: {
            chainId: 11155111,
            name: "Sepolia Testnet",
            rpc: "https://ethereum-sepolia-rpc.publicnode.com",
            explorer: "https://sepolia.etherscan.io",
            nativeSymbol: "SEP"
        },
        mainnet: {
            chainId: 1,
            name: "Ethereum Mainnet",
            rpc: "https://ethereum-rpc.publicnode.com",
            explorer: "https://etherscan.io",
            nativeSymbol: "ETH"
        }
    },

    // 2. Define Assets (Coins & Tokens)
    // "type: NATIVE" = ETH/SEP (Uses standard transfer)
    // "type: ERC20"  = Tokens (Uses Smart Contract transfer)
    assets: {
        sepolia: [
            { symbol: "SEP", name: "Sepolia ETH", type: "NATIVE", decimals: 18 },
            { symbol: "TEST-UNI", name: "Uniswap Test", type: "ERC20", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", decimals: 18 }
        ],
        mainnet: [
            { symbol: "ETH", name: "Ether", type: "NATIVE", decimals: 18 },
            { symbol: "USDT", name: "Tether USD", type: "ERC20", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
            { symbol: "USDC", name: "USD Coin", type: "ERC20", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 }
        ]
    }
};

// Standard ERC-20 ABI (Needed to talk to token contracts)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function decimals() view returns (uint8)"
];
