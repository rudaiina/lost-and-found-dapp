// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Decentralized Lost & Found Recovery with Bounty Escrow
 * @dev Manages lost items, deposits bounties, and securely releases rewards upon verified return.
 */
contract LostAndFound {
    enum ItemStatus {
        Lost,
        Claimed,
        Recovered
    }

    struct Item {
        uint256 id;
        string title;
        string description;
        uint256 bountyAmount;
        address payable owner;
        address payable finder;
        string claimProof;
        ItemStatus status;
    }

    uint256 public totalItemsCount;
    mapping(uint256 => Item) private items;

    // Events
    event ItemReported(uint256 itemId, string title, address owner, uint256 bountyAmount);
    event ItemClaimed(uint256 itemId, address finder, string proofDetails);
    event ItemRecovered(uint256 itemId, address owner, address finder, uint256 bountyPaid);

    /**
     * @notice Report a lost item and lock the deposited bounty into the smart contract escrow.
     * @param _title Title of the item
     * @param _description Serial number, color, or location details
     */
    function reportLostItem(string memory _title, string memory _description) external payable {
        require(bytes(_title).length > 0, "Item title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        totalItemsCount++;
        uint256 newItemId = totalItemsCount;

        items[newItemId] = Item({
            id: newItemId,
            title: _title,
            description: _description,
            bountyAmount: msg.value,
            owner: payable(msg.sender),
            finder: payable(address(0)),
            claimProof: "",
            status: ItemStatus.Lost
        });

        emit ItemReported(newItemId, _title, msg.sender, msg.value);
    }

    /**
     * @notice Finder submits a claim for a lost item with location/contact proof.
     * @param _itemId ID of the lost item
     * @param _proofDetails Proof information provided by the finder
     */
    function claimFoundItem(uint256 _itemId, string memory _proofDetails) external {
        require(_itemId > 0 && _itemId <= totalItemsCount, "Item does not exist");
        Item storage item = items[_itemId];

        require(item.status == ItemStatus.Lost, "Item is not in Lost status");
        require(msg.sender != item.owner, "Owner cannot claim their own lost item");
        require(bytes(_proofDetails).length > 0, "Proof details cannot be empty");

        item.finder = payable(msg.sender);
        item.claimProof = _proofDetails;
        item.status = ItemStatus.Claimed;

        emit ItemClaimed(_itemId, msg.sender, _proofDetails);
    }

    /**
     * @notice Owner confirms item has been safely returned and releases bounty to the finder.
     * @param _itemId ID of the item
     */
    function confirmReturnAndReleaseBounty(uint256 _itemId) external {
        require(_itemId > 0 && _itemId <= totalItemsCount, "Item does not exist");
        Item storage item = items[_itemId];

        require(msg.sender == item.owner, "Only the item owner can confirm return");
        require(item.status == ItemStatus.Claimed, "Item is not currently claimed");
        require(item.finder != address(0), "No valid finder assigned");

        item.status = ItemStatus.Recovered;
        uint256 bounty = item.bountyAmount;

        // If bounty was deposited, transfer directly to finder
        if (bounty > 0) {
            (bool sent, ) = item.finder.call{value: bounty}("");
            require(sent, "Failed to transfer bounty to finder");
        }

        emit ItemRecovered(_itemId, item.owner, item.finder, bounty);
    }

    /**
     * @notice Get single item details by ID
     */
    function getItem(uint256 _itemId) external view returns (Item memory) {
        require(_itemId > 0 && _itemId <= totalItemsCount, "Item does not exist");
        return items[_itemId];
    }

    /**
     * @notice Get all reported items in an array
     */
    function getAllLostItems() external view returns (Item[] memory) {
        Item[] memory allItems = new Item[](totalItemsCount);
        for (uint256 i = 1; i <= totalItemsCount; i++) {
            allItems[i - 1] = items[i];
        }
        return allItems;
    }
}