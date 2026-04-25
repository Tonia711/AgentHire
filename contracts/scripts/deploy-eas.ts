import { ethers } from "hardhat";

const ALREADY_DEPLOYED = {
  MOCK_DNZD: "0x781A1Df150974E8dE40044F08eBdf4a0D7253D19",
  INVOICE: "0x2cB8295DF6F0B4AadD83686F316250a4f6fF156A",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  const SchemaRegistry = await ethers.getContractFactory("SchemaRegistry");
  const schemaRegistry = await SchemaRegistry.deploy();
  await schemaRegistry.waitForDeployment();
  const schemaRegistryAddr = await schemaRegistry.getAddress();
  console.log("SchemaRegistry deployed to:", schemaRegistryAddr);

  const EAS = await ethers.getContractFactory("EAS");
  const eas = await EAS.deploy(schemaRegistryAddr);
  await eas.waitForDeployment();
  const easAddr = await eas.getAddress();
  console.log("EAS deployed to:", easAddr);

  const schemaTx = await schemaRegistry.register(
    "bytes32 documentHash, address signer, string civicPassId, uint64 timestamp",
    ethers.ZeroAddress,
    true
  );
  const schemaReceipt = await schemaTx.wait();
  const schemaUid = schemaReceipt?.logs?.[0]?.topics?.[1] ?? "CHECK_TX_LOGS";
  console.log("Schema registered. UID:", schemaUid);

  console.log("\n=== SHARE THESE WITH YOUR TEAM ===");
  console.log(`NEXT_PUBLIC_MOCK_DNZD_ADDRESS=${ALREADY_DEPLOYED.MOCK_DNZD}`);
  console.log(`NEXT_PUBLIC_INVOICE_ADDRESS=${ALREADY_DEPLOYED.INVOICE}`);
  console.log(`NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=${schemaRegistryAddr}`);
  console.log(`NEXT_PUBLIC_EAS_ADDRESS=${easAddr}`);
  console.log(`NEXT_PUBLIC_SCHEMA_UID=${schemaUid}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
