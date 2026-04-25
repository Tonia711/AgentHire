# KiwiContract — Live on Avalanche Fuji (chain ID 43113)

Deployed by Team 3 from `0xD700306E42E545CC7cb22BD99b4a6d362c3CE607`.

## Paste this into `.env.local` (Team 1) and any backend config (Team 2)

```env
NEXT_PUBLIC_MOCK_DNZD_ADDRESS=0x781A1Df150974E8dE40044F08eBdf4a0D7253D19
NEXT_PUBLIC_INVOICE_ADDRESS=0x2cB8295DF6F0B4AadD83686F316250a4f6fF156A
NEXT_PUBLIC_SCHEMA_REGISTRY_ADDRESS=0x94068b5a38685dEe492e57189C8e8dE9AB4E9653
NEXT_PUBLIC_EAS_ADDRESS=0xf65bC03e69f5C1a295f744c615Fc7Da79B6D0E8F
NEXT_PUBLIC_SCHEMA_UID=0xc50bb95df2ea22c7b91ea506a44e1744cb19be30870bbc433d57c8951ef07d96
```

## Snowtrace links (verify on-chain)

### Contract addresses
- MockDNZD: https://testnet.snowtrace.io/address/0x781A1Df150974E8dE40044F08eBdf4a0D7253D19
- Invoice: https://testnet.snowtrace.io/address/0x2cB8295DF6F0B4AadD83686F316250a4f6fF156A
- SchemaRegistry: https://testnet.snowtrace.io/address/0x94068b5a38685dEe492e57189C8e8dE9AB4E9653
- EAS: https://testnet.snowtrace.io/address/0xf65bC03e69f5C1a295f744c615Fc7Da79B6D0E8F

### End-to-end flow (verified working)
- Mint 100k dNZD treasury → https://testnet.snowtrace.io/tx/0xd75480ab79f7bcfa5750cc5543e8e8cd951b58f02f9ebc2b81ef9a0effbaebc2
- Create invoice ($800 + $120 GST) → https://testnet.snowtrace.io/tx/0xcd3f7b781e1937252708ad4f293db78709a1a7117456131c798715cea7ab6b2b
- Transfer 920 dNZD to contractor → https://testnet.snowtrace.io/tx/0x0633d8427f9a70d2c3607c4782b7ad5b938d1b17374cf53c8f3f86db54f3ad6d
- Mark invoice paid → https://testnet.snowtrace.io/tx/0x9b7320e97043f3cd68d73116bf981d234f9623034d993ef83a96c0643e863eed
- Create EAS attestation → https://testnet.snowtrace.io/tx/0x4f5a9d6933ede262ef46aea031e5226f67ae6ac07c8bd77180924f70ca06e785

### Demo contractor used in e2e (ephemeral — Sarah)
- Address: `0x635B5c22889127D976eFeC1160a103f06b5a7Aff`
- Holds 920 dNZD on Fuji as live proof of payment
