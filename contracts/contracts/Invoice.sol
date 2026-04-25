// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Invoice {
    enum Status { Created, Paid, Disputed }

    struct InvoiceData {
        address business;
        address contractor;
        uint256 amount;
        uint256 gstAmount;
        string description;
        Status status;
        uint256 createdAt;
        uint256 paidAt;
    }

    mapping(uint256 => InvoiceData) public invoices;
    uint256 public nextId;

    event InvoiceCreated(uint256 id, address business, address contractor, uint256 total);
    event InvoicePaid(uint256 id, bytes32 txHash);

    function createInvoice(
        address contractor,
        uint256 amount,
        uint256 gstAmount,
        string calldata desc
    ) external returns (uint256) {
        uint256 id = nextId++;
        invoices[id] = InvoiceData(
            msg.sender,
            contractor,
            amount,
            gstAmount,
            desc,
            Status.Created,
            block.timestamp,
            0
        );
        emit InvoiceCreated(id, msg.sender, contractor, amount + gstAmount);
        return id;
    }

    function markPaid(uint256 id) external {
        require(invoices[id].business == msg.sender, "Only business can mark paid");
        invoices[id].status = Status.Paid;
        invoices[id].paidAt = block.timestamp;
    }
}
