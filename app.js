// ==========================================
// CONFIGURATION: CONTRACT ADDRESS & ABI
// ==========================================
const CONTRACT_ADDRESS = "0x7D3C58C9B884E6b74EdD79e4d32dDc2f047C8336";
const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7"; // Sepolia (11155111)

const ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "itemId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "finder", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "proofDetails", "type": "string" }
    ],
    "name": "ItemClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "itemId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "finder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "bountyPaid", "type": "uint256" }
    ],
    "name": "ItemRecovered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "itemId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "bountyAmount", "type": "uint256" }
    ],
    "name": "ItemReported",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_itemId", "type": "uint256" },
      { "internalType": "string", "name": "_proofDetails", "type": "string" }
    ],
    "name": "claimFoundItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_itemId", "type": "uint256" }
    ],
    "name": "confirmReturnAndReleaseBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllLostItems",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "bountyAmount", "type": "uint256" },
          { "internalType": "address payable", "name": "owner", "type": "address" },
          { "internalType": "address payable", "name": "finder", "type": "address" },
          { "internalType": "string", "name": "claimProof", "type": "string" },
          { "internalType": "enum LostAndFound.ItemStatus", "name": "status", "type": "uint8" }
        ],
        "internalType": "struct LostAndFound.Item[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_itemId", "type": "uint256" }
    ],
    "name": "getItem",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "bountyAmount", "type": "uint256" },
          { "internalType": "address payable", "name": "owner", "type": "address" },
          { "internalType": "address payable", "name": "finder", "type": "address" },
          { "internalType": "string", "name": "claimProof", "type": "string" },
          { "internalType": "enum LostAndFound.ItemStatus", "name": "status", "type": "uint8" }
        ],
        "internalType": "struct LostAndFound.Item",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalItemsCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" }
    ],
    "name": "reportLostItem",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

let provider;
let signer;
let contract;
let currentAccount = null;

// ==========================================
// NOTIFICATIONS HELPER
// ==========================================
function showNotification(message, type = "info") {
  const el = document.getElementById("notification");
  if (!el) return;
  el.className = `notification ${type}`;
  el.innerText = message;
  el.classList.remove("hidden");
  setTimeout(() => {
    el.classList.add("hidden");
  }, 6000);
}

// ==========================================
// METAMASK WALLET CONNECTION
// ==========================================
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showNotification("MetaMask is not installed. Please install MetaMask to use this application.", "error");
    return;
  }

  try {
    showNotification("Connecting to MetaMask...", "info");
    
    // Request account access
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];

    // Initialize Ethers v6 BrowserProvider
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    // Check Network
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      await switchNetworkToSepolia();
    } else {
      const netBadge = document.getElementById("networkName");
      if (netBadge) {
        netBadge.innerText = "Sepolia Testnet";
        netBadge.className = "badge badge-connected";
      }
    }

    // Update UI
    const addrEl = document.getElementById("walletAddress");
    if (addrEl) {
      addrEl.innerText = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    }
    
    const statusBadge = document.getElementById("walletStatusBadge");
    if (statusBadge) {
      statusBadge.innerText = "Connected";
      statusBadge.className = "badge badge-connected";
    }

    const connectBtn = document.getElementById("connectWalletBtn");
    if (connectBtn) {
      connectBtn.innerText = "Wallet Connected ✅";
      connectBtn.disabled = true;
    }

    // Initialize Contract Instance
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    await loadAllItems();
    showNotification("Connected successfully to Sepolia!", "success");

  } catch (error) {
    console.error(error);
    showNotification("Failed to connect wallet: " + (error.reason || error.message), "error");
  }
}

// Switch or Add Sepolia Network
async function switchNetworkToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }]
    });
    const netBadge = document.getElementById("networkName");
    if (netBadge) {
      netBadge.innerText = "Sepolia Testnet";
      netBadge.className = "badge badge-connected";
    }
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_HEX_CHAIN_ID,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"]
            }
          ]
        });
      } catch (addError) {
        showNotification("Failed to add Sepolia testnet to MetaMask.", "error");
      }
    } else {
      showNotification("Please manually switch your MetaMask to Sepolia Test Network.", "warning");
    }
  }
}

// ==========================================
// REPORT LOST ITEM & LOCK BOUNTY
// ==========================================
async function handleReportItem(event) {
  event.preventDefault();
  if (!contract) return showNotification("Please connect your wallet first!", "error");

  const title = document.getElementById("itemTitle").value.trim();
  const description = document.getElementById("itemDescription").value.trim();
  const bountyEth = document.getElementById("itemBounty").value;

  if (!title || !description || !bountyEth) {
    return showNotification("Please fill all required fields.", "error");
  }

  try {
    const bountyInWei = ethers.parseEther(bountyEth.toString());
    const reportBtn = document.getElementById("reportBtn");
    if (reportBtn) {
      reportBtn.disabled = true;
      reportBtn.innerText = "Confirm in MetaMask...";
    }

    showNotification("Submitting transaction to MetaMask...", "info");
    const tx = await contract.reportLostItem(title, description, { value: bountyInWei });
    
    showNotification("Transaction submitted. Waiting for Sepolia block confirmation...", "info");
    await tx.wait();

    showNotification(`Item "${title}" successfully reported with ${bountyEth} ETH bounty!`, "success");
    document.getElementById("reportItemForm").reset();
    await loadAllItems();
  } catch (error) {
    console.error(error);
    showNotification("Transaction Failed: " + (error.reason || error.message), "error");
  } finally {
    const reportBtn = document.getElementById("reportBtn");
    if (reportBtn) {
      reportBtn.disabled = false;
      reportBtn.innerText = "Report Lost Item & Lock Bounty";
    }
  }
}

// ==========================================
// CLAIM FOUND ITEM (FINDER)
// ==========================================
async function claimItem(itemId) {
  if (!contract) return showNotification("Please connect your wallet first!", "error");

  const proofInput = document.getElementById(`claimProof_${itemId}`);
  const proofDetails = proofInput ? proofInput.value.trim() : "";

  if (!proofDetails) {
    return showNotification("Please describe where you found it or provide proof info.", "error");
  }

  try {
    showNotification("Submitting claim to MetaMask...", "info");
    const tx = await contract.claimFoundItem(itemId, proofDetails);
    
    showNotification("Waiting for block confirmation...", "info");
    await tx.wait();

    showNotification("Claim submitted successfully! The owner will verify and release your bounty.", "success");
    await loadAllItems();
  } catch (error) {
    console.error(error);
    showNotification("Failed to claim item: " + (error.reason || error.message), "error");
  }
}

// ==========================================
// CONFIRM RETURN & RELEASE BOUNTY (OWNER)
// ==========================================
async function confirmReturn(itemId) {
  if (!contract) return showNotification("Please connect your wallet first!", "error");

  try {
    showNotification("Confirming return in MetaMask...", "info");
    const tx = await contract.confirmReturnAndReleaseBounty(itemId);

    showNotification("Releasing bounty to finder...", "info");
    await tx.wait();

    showNotification("Item return confirmed! Bounty has been paid to finder's wallet.", "success");
    await loadAllItems();
  } catch (error) {
    console.error(error);
    showNotification("Confirmation failed: " + (error.reason || error.message), "error");
  }
}

// ==========================================
// LOAD ALL ITEMS FROM SMART CONTRACT
// ==========================================
async function loadAllItems() {
  if (!contract) return;
  const grid = document.getElementById("itemsGrid");
  if (!grid) return;

  try {
    const items = await contract.getAllLostItems();

    if (!items || items.length === 0) {
      grid.innerHTML = '<p class="placeholder-text">No lost items registered yet.</p>';
      return;
    }

    grid.innerHTML = "";

    // Status Map: 0 = Lost, 1 = Claimed, 2 = Recovered
    items.forEach((item) => {
      const id = item.id.toString();
      const title = item.title;
      const description = item.description;
      const bounty = ethers.formatEther(item.bountyAmount);
      const owner = item.owner;
      const finder = item.finder;
      const claimProof = item.claimProof;
      const status = Number(item.status);

      const isOwner = currentAccount && currentAccount.toLowerCase() === owner.toLowerCase();
      const isFinder = currentAccount && currentAccount.toLowerCase() === finder.toLowerCase();

      let statusBadge = "";
      let statusClass = "lost";
      let actionHtml = "";

      if (status === 0) {
        statusBadge = '<span class="badge badge-warning">Status: LOST</span>';
        statusClass = "lost";

        if (isOwner) {
          actionHtml = `<p class="placeholder-text" style="font-size:0.8rem;">You reported this item. Waiting for a finder.</p>`;
        } else {
          actionHtml = `
            <div style="margin-top:0.5rem;">
              <input type="text" id="claimProof_${id}" class="input-sm" placeholder="e.g. Found at Main Canteen / My Contact" />
              <button class="btn btn-warning btn-sm btn-block" onclick="claimItem(${id})">Submit Found Claim</button>
            </div>
          `;
        }
      } else if (status === 1) {
        statusBadge = '<span class="badge badge-warning">Status: CLAIM PENDING</span>';
        statusClass = "claimed";

        if (isOwner) {
          actionHtml = `
            <div class="claim-proof-box">
              <strong>Finder Claim Proof:</strong>
              <p>${claimProof}</p>
              <p style="font-size: 0.75rem; color: gray;">Finder Address: ${finder.substring(0, 6)}...${finder.substring(finder.length - 4)}</p>
            </div>
            <button class="btn btn-success btn-sm btn-block" style="margin-top:0.5rem;" onclick="confirmReturn(${id})">Confirm Return & Release ${bounty} ETH</button>
          `;
        } else if (isFinder) {
          actionHtml = `<p class="placeholder-text" style="font-size:0.8rem; color:green;">You claimed this item. Waiting for owner to confirm and release bounty.</p>`;
        } else {
          actionHtml = `<p class="placeholder-text" style="font-size:0.8rem;">Claim is currently being reviewed by owner.</p>`;
        }
      } else if (status === 2) {
        statusBadge = '<span class="badge badge-connected">Status: RECOVERED ✅</span>';
        statusClass = "recovered";
        actionHtml = `<p style="color: var(--success); font-weight: 600; font-size: 0.85rem;">Recovered & Bounty Paid to Finder!</p>`;
      }

      const card = document.createElement("div");
      card.className = `item-card ${statusClass}`;
      card.innerHTML = `
        <div>
          <div class="item-header">
            <h3>#${id} ${title}</h3>
            <span class="bounty-tag">${bounty} ETH</span>
          </div>
          <div style="margin: 0.4rem 0;">${statusBadge}</div>
          <div class="item-body">
            <p><strong>Details:</strong> ${description}</p>
            <p><strong>Owner:</strong> ${owner.substring(0, 6)}...${owner.substring(owner.length - 4)}</p>
          </div>
        </div>
        <div>
          ${actionHtml}
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading items:", error);
    showNotification("Failed to fetch items from smart contract.", "error");
  }
}

// Listen for wallet account & network changes
if (window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      location.reload();
    } else {
      currentAccount = accounts[0];
      connectWallet();
    }
  });

  window.ethereum.on("chainChanged", () => {
    location.reload();
  });
}