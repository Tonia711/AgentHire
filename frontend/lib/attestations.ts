import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { ADDRESSES } from "./contracts";

const schemaEncoder = new SchemaEncoder(
  "bytes32 documentHash, address signer, string civicPassId, uint64 timestamp",
);

export async function createContractorAttestation(
  signer: ethers.Signer,
  contractorAddress: string,
  documentHash: string,
  civicPassId: string,
) {
  const eas = new EAS(ADDRESSES.EAS);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eas.connect(signer as any);

  const encodedData = schemaEncoder.encodeData([
    { name: "documentHash", value: documentHash, type: "bytes32" },
    { name: "signer", value: contractorAddress, type: "address" },
    { name: "civicPassId", value: civicPassId || "pending", type: "string" },
    { name: "timestamp", value: BigInt(Math.floor(Date.now() / 1000)), type: "uint64" },
  ]);

  const tx = await eas.attest({
    schema: ADDRESSES.SCHEMA_UID,
    data: {
      recipient: contractorAddress,
      expirationTime: 0n,
      revocable: true,
      data: encodedData,
    },
  });

  const attestationUID = await tx.wait();
  return attestationUID;
}

export function hashDocument(content: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(content));
}
