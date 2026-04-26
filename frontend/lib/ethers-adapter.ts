import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { WalletClient } from "viem";

export function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  if (!account || !chain) {
    throw new Error("Wallet client missing account or chain");
  }
  const network = {
    chainId: chain.id,
    name: chain.name,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new BrowserProvider(transport as any, network);
  return new JsonRpcSigner(provider, account.address);
}
