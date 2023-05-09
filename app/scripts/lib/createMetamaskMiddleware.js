import { createScaffoldMiddleware, mergeMiddleware } from 'json-rpc-engine';
import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from './middleware/pending';

export default function createMetamaskMiddleware({
  version,
  getAccounts,
  processTransaction,
  processEthSignMessage,
  processTypedMessage,
  processTypedMessageV3,
  processTypedMessageV4,
  processPersonalMessage,
  processDecryptMessage,
  processEncryptionPublicKey,
  getPendingNonce,
  // getPendingTransactionByHash,
  signTolarTransaction,
}) {
  const metamaskMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      eth_syncing: false,
      web3_clientVersion: `Taquin/v${version}`,
    }),
    createWalletMiddleware({
      getAccounts,
      processTransaction,
      processEthSignMessage,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
      processPersonalMessage,
      processDecryptMessage,
      processEncryptionPublicKey,
    }),
    createPendingNonceMiddleware({ getPendingNonce }),
    // createPendingTxMiddleware({ getPendingTransactionByHash }),
    createPendingTxMiddleware({
      signTolarTransaction,
    }),
  ]);
  return metamaskMiddleware;
}
