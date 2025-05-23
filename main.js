import { WalletConnectModal } from '@walletconnect/modal';
import { SignClient } from '@walletconnect/sign-client';
import TronWeb from 'tronweb';

const connectBtn = document.getElementById('connect');
const trustBtn = document.getElementById('trustwallet');
const sendBtn = document.getElementById('send');
const output = document.getElementById('output');

let tronWeb = null;
let session = null;
let address = null;

const projectId = '5fc507d8fc7ae913fff0b8071c7df231';

const metadata = {
  name: 'WalletConnect Tron DApp',
  description: 'DApp for Tron using WalletConnect',
  url: 'https://yourapp.com',
  icons: ['https://yourapp.com/icon.png']
};

const modal = new WalletConnectModal({
  projectId,
  metadata,
  themeMode: 'dark',
});

const signClient = await SignClient.init({ projectId, metadata });

const connectWallet = async (uriHandler) => {
  output.textContent = '🔄 Инициализация WalletConnect...';

  const { uri, approval } = await signClient.connect({
    requiredNamespaces: {
      tron: {
        methods: ['tron_signTransaction', 'tron_signMessage'],
        chains: ['tron:0x2b6653dc'],
        events: ['accountsChanged', 'chainChanged'],
      },
    },
  });

  if (uri) {
    uriHandler(uri);
  }

  session = await approval();
  modal.closeModal();

  const accounts = session.namespaces.tron.accounts;
  address = accounts[0].split(':')[2];
  output.textContent = `✅ Подключено: ${address}`;

  tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
  });

  const balance = await tronWeb.trx.getBalance(address);
  output.textContent += `\n💰 Баланс: ${balance / 1e6} TRX`;
  sendBtn.disabled = false;
};

connectBtn.onclick = async () => {
  await connectWallet((uri) => modal.openModal({ uri }));
};

trustBtn.onclick = async () => {
  await connectWallet((uri) => {
    const trustUrl = `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`;
    window.open(trustUrl, '_blank');
  });
};

sendBtn.onclick = async () => {
  if (!address || !tronWeb) return;

  const tx = await tronWeb.transactionBuilder.sendTrx(
    address,
    1000000, // 1 TRX
    address
  );

  const result = await signClient.request({
    topic: session.topic,
    chainId: 'tron:0x2b6653dc',
    request: {
      method: 'tron_signTransaction',
      params: [tx],
    },
  });

  output.textContent += `\n📤 Транзакция отправлена: ${JSON.stringify(result)}`;
};
