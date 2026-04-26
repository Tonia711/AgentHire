import { ethers } from "ethers";

const wallet = ethers.Wallet.createRandom();

console.log("=== NEW DEMO WALLET (Fuji testnet only — do not use for real funds) ===");
console.log("Address:    ", wallet.address);
console.log("Private key:", wallet.privateKey);
console.log("Mnemonic:   ", wallet.mnemonic?.phrase);
console.log("\nNext steps:");
console.log("1. Paste the private key into contracts/.env as DEPLOYER_PRIVATE_KEY=...");
console.log("2. Visit https://faucet.avax.network/ — pick Fuji C-Chain — paste the Address above");
console.log("3. Run: npm run deploy:fuji");
