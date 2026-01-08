// config.js

const CONFIG = {
    // 1. Networks
    networks: {
        sepolia: {
            chainId: 11155111,
            name: "Sepolia Testnet",
            rpc: "https://ethereum-sepolia-rpc.publicnode.com",
            explorer: "https://sepolia.etherscan.io"
        },
        mainnet: {
            chainId: 1,
            name: "Ethereum Mainnet",
            rpc: "https://ethereum-rpc.publicnode.com",
            explorer: "https://etherscan.io"
        }
    },

    // 2. Assets (Coins & Tokens)
    // Note: 'NATIVE' means ETH/SEP. 'ERC20' means a token contract.
    assets: {
        sepolia: [
            { symbol: "SEP", name: "Sepolia ETH", type: "NATIVE", decimals: 18 },
            { symbol: "UniFi", name: "UniFi Token", type: "ERC20", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", decimals: 18 } 
            // ^ Note: This is just an example address (Uniswap) for testing logic
        ],
        mainnet: [
            { symbol: "ETH", name: "Ether", type: "NATIVE", decimals: 18 },
            { symbol: "USDT", name: "Tether USD", type: "ERC20", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
            { symbol: "UNI", name: "Uniswap", type: "ERC20", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", decimals: 18 }
        ]
    }
};

// Standard ERC-20 ABI (Minimal)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function decimals() view returns (uint8)"
];
