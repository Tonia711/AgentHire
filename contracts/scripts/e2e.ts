import { ethers } from "hardhat";

const ADDRESSES = {
  MOCK_DNZD: "0x781A1Df150974E8dE40044F08eBdf4a0D7253D19",
  INVOICE: "0x2cB8295DF6F0B4AadD83686F316250a4f6fF156A",
  EAS: "0xf65bC03e69f5C1a295f744c615Fc7Da79B6D0E8F",
  SCHEMA_UID: "0xc50bb95df2ea22c7b91ea506a44e1744cb19be30870bbc433d57c8951ef07d96",
};

const MOCK_DNZD_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
];

const INVOICE_ABI = [
  "function createInvoice(address contractor, uint256 amount, uint256 gstAmount, string desc) returns (uint256)",
  "function markPaid(uint256 id)",
  "function nextId() view returns (uint256)",
  "function invoices(uint256) view returns (address business, address contractor, uint256 amount, uint256 gstAmount, string description, uint8 status, uint256 createdAt, uint256 paidAt)",
];

const EAS_ABI = [
  "function attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID, bytes data, uint256 value) data)) payable returns (bytes32)",
];

function snow(hash: string) {
  return `https://testnet.snowtrace.io/tx/${hash}`;
}

async function main() {
  const [business] = await ethers.getSigners();
  console.log("Business wallet:", business.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(business.address)), "AVAX\n");

  const contractor = ethers.Wallet.createRandom();
  console.log("Demo contractor wallet (Sarah):", contractor.address);
  console.log("(private key kept ephemeral — for demo display only)\n");

  const dNZD = new ethers.Contract(ADDRESSES.MOCK_DNZD, MOCK_DNZD_ABI, business);
  const invoice = new ethers.Contract(ADDRESSES.INVOICE, INVOICE_ABI, business);
  const eas = new ethers.Contract(ADDRESSES.EAS, EAS_ABI, business);

  // --- 1. Mint treasury to business wallet ---
  console.log("[1/5] Minting 100,000 dNZD treasury to business wallet...");
  const mintTx = await dNZD.mint(business.address, ethers.parseEther("100000"));
  await mintTx.wait();
  console.log("    tx:", snow(mintTx.hash));
  console.log("    business dNZD balance:", ethers.formatEther(await dNZD.balanceOf(business.address)), "\n");

  // --- 2. Create on-chain invoice ---
  console.log("[2/5] Creating invoice — 10 hours @ $80/hr + 15% GST = $920...");
  const amount = ethers.parseEther("800");
  const gst = ethers.parseEther("120");
  const desc = "Sarah — 10 hours electrical work, week of 25 Apr 2026";
  const invTx = await invoice.createInvoice(contractor.address, amount, gst, desc);
  const invReceipt = await invTx.wait();
  const invoiceId = (await invoice.nextId()) - 1n;
  console.log("    tx:", snow(invTx.hash));
  console.log("    invoice id:", invoiceId.toString(), "\n");

  // --- 3. Transfer dNZD payment ---
  console.log("[3/5] Transferring 920 dNZD to contractor...");
  const total = amount + gst;
  const payTx = await dNZD.transfer(contractor.address, total);
  await payTx.wait();
  console.log("    tx:", snow(payTx.hash));
  console.log("    contractor dNZD balance:", ethers.formatEther(await dNZD.balanceOf(contractor.address)), "\n");

  // --- 4. Mark invoice paid ---
  console.log("[4/5] Marking invoice", invoiceId.toString(), "paid on-chain...");
  const markTx = await invoice.markPaid(invoiceId);
  await markTx.wait();
  console.log("    tx:", snow(markTx.hash), "\n");

  // --- 5. Create EAS attestation ---
  console.log("[5/5] Creating EAS attestation for contractor identity...");
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Sarah's signed agreement, hash placeholder"));
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedData = abiCoder.encode(
    ["bytes32", "address", "string", "uint64"],
    [documentHash, contractor.address, "civic-stub-demo-pass-001", BigInt(Math.floor(Date.now() / 1000))]
  );
  const attestTx = await eas.attest({
    schema: ADDRESSES.SCHEMA_UID,
    data: {
      recipient: contractor.address,
      expirationTime: 0n,
      revocable: true,
      refUID: ethers.ZeroHash,
      data: encodedData,
      value: 0n,
    },
  });
  const attestReceipt = await attestTx.wait();
  const attestationUid = attestReceipt?.logs?.find((l: any) => l.topics?.length >= 2)?.topics?.[1];
  console.log("    tx:", snow(attestTx.hash));
  console.log("    attestation UID:", attestationUid, "\n");

  console.log("=== END-TO-END FLOW VERIFIED ===");
  console.log("Snowtrace links above prove every step ran on Avalanche Fuji.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
