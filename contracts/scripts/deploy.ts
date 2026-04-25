import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  const MockDNZD = await ethers.getContractFactory("MockDNZD");
  const dNZD = await MockDNZD.deploy();
  await dNZD.waitForDeployment();
  const dNZDAddr = await dNZD.getAddress();
  console.log("MockDNZD deployed to:", dNZDAddr);

  const Invoice = await ethers.getContractFactory("Invoice");
  const invoice = await Invoice.deploy();
  await invoice.waitForDeployment();
  const invoiceAddr = await invoice.getAddress();
  console.log("Invoice deployed to:", invoiceAddr);

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
  console.log("Schema registered. UID (from logs):", schemaUid);

  console.log("\n=== SHARE THESE WITH YOUR TEAM ===");
  console.log(`NEXT_PUBLIC_MOCK_DNZD_ADDRESS=${dNZDAddr}`);
  console.log(`NEXT_PUBLIC_INVOICE_ADDRESS=${invoiceAddr}`);
  console.log(`NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=${schemaRegistryAddr}`);
  console.log(`NEXT_PUBLIC_EAS_ADDRESS=${easAddr}`);
  console.log(`NEXT_PUBLIC_SCHEMA_UID=${schemaUid}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
