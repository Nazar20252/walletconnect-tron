import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import TronWeb from "tronweb";

const connectBtn = document.getElementById("connect");
const sendBtn = document.getElementById("send");
const output = document.getElementById("output");

let tronWeb = null;
let currentAddress = "";

async function connectWallet() {
  output.textContent = "🔄 Инициализация WalletConnect...";

  const client = await SignClient.init({
    projectId: "5fc507d8fc7ae913fff0b8071c7df231",
    relayUrl: "wss://relay.walletconnect.com",
    metadata: {
      name: "Tron Official DApp",
      description: "Connect to Tron via WalletConnect",
      url: "https://tron.network",
      icons: ["https://cryptologos.cc/logos/tron-trx-logo.png"]
    }
  });

  const modal = new WalletConnectModal({
    projectId: "5fc507d8fc7ae913fff0b8071c7df231",
    themeMode: "dark",
    explorerRecommendedWalletIds: "NONE",
    explorerExcludedWalletIds: "NONE",
    chains: ["tron:0x2b6653dc"],
    standaloneChains: ["tron"]
  });

  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      tron: {
        methods: ["tron_signMessage"],
        chains: ["tron:0x2b6653dc"],
        events: ["accountsChanged", "chainChanged"]
      }
    }
  });

  if (uri) modal.openModal({ uri });

  const session = await approval();
  modal.closeModal();

  currentAddress = session.namespaces.tron.accounts[0].split(":")[2];
  output.textContent = "✅ Подключено: " + currentAddress;

  tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io"
  });

  const balance = await tronWeb.trx.getBalance(currentAddress);
  output.textContent += "\n💰 Баланс: " + (balance / 1e6).toFixed(2) + " TRX";

  sendBtn.disabled = false;
}

async function sendTrx() {
  const to = prompt("Введи адрес получателя:");
  const amountTRX = parseFloat(prompt("Сколько TRX отправить?"));
  const amountSun = amountTRX * 1e6;

  try {
    const tx = await tronWeb.transactionBuilder.sendTrx(to, amountSun, currentAddress);
    output.textContent += `\n📤 Транзакция создана: ${tx.txID}`;
  } catch (err) {
    output.textContent += "\n❌ Ошибка отправки: " + err.message;
  }
}

connectBtn.addEventListener("click", connectWallet);
sendBtn.addEventListener("click", sendTrx);
