import { ethers } from "ethers";

export const ADDRESSES = {
  MOCK_DNZD:
    process.env.NEXT_PUBLIC_MOCK_DNZD_ADDRESS ||
    "0x0000000000000000000000000000000000000000",
  INVOICE:
    process.env.NEXT_PUBLIC_INVOICE_ADDRESS ||
    "0x0000000000000000000000000000000000000000",
  EAS:
    process.env.NEXT_PUBLIC_EAS_ADDRESS ||
    "0x0000000000000000000000000000000000000000",
  SCHEMA_REGISTRY:
    process.env.NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS ||
    "0x0000000000000000000000000000000000000000",
  SCHEMA_UID:
    process.env.NEXT_PUBLIC_SCHEMA_UID ||
    "0x0000000000000000000000000000000000000000000000000000000000000000",
};

export const MOCK_DNZD_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

export const INVOICE_ABI = [
  "function createInvoice(address contractor, uint256 amount, uint256 gstAmount, string desc) returns (uint256)",
  "function markPaid(uint256 id)",
  "function invoices(uint256) view returns (address business, address contractor, uint256 amount, uint256 gstAmount, string description, uint8 status, uint256 createdAt, uint256 paidAt)",
  "function nextId() view returns (uint256)",
  "event InvoiceCreated(uint256 id, address business, address contractor, uint256 total)",
  "event InvoicePaid(uint256 id, bytes32 txHash)",
];

export async function createOnChainInvoice(
  signer: ethers.Signer,
  contractorAddress: string,
  amountNZD: number,
  gstAmountNZD: number,
  description: string,
) {
  const contract = new ethers.Contract(ADDRESSES.INVOICE, INVOICE_ABI, signer);
  const amount = ethers.parseEther(amountNZD.toString());
  const gst = ethers.parseEther(gstAmountNZD.toString());
  const tx = await contract.createInvoice(contractorAddress, amount, gst, description);
  const receipt = await tx.wait();
  return { txHash: receipt.hash as string, receipt };
}

export async function payContractor(
  signer: ethers.Signer,
  contractorAddress: string,
  totalAmountNZD: number,
) {
  const dNZD = new ethers.Contract(ADDRESSES.MOCK_DNZD, MOCK_DNZD_ABI, signer);
  const amount = ethers.parseEther(totalAmountNZD.toString());
  const tx = await dNZD.transfer(contractorAddress, amount);
  const receipt = await tx.wait();
  return { txHash: receipt.hash as string, receipt };
}

export async function getDNZDBalance(
  provider: ethers.Provider,
  address: string,
): Promise<string> {
  const dNZD = new ethers.Contract(ADDRESSES.MOCK_DNZD, MOCK_DNZD_ABI, provider);
  const balance = await dNZD.balanceOf(address);
  return ethers.formatEther(balance);
}

export async function markInvoicePaid(signer: ethers.Signer, invoiceId: number) {
  const contract = new ethers.Contract(ADDRESSES.INVOICE, INVOICE_ABI, signer);
  const tx = await contract.markPaid(invoiceId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash as string, receipt };
}
