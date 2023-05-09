// import Web3 from '@tolar/web3';
import EthQuery from 'eth-query';
import { ObservableStore } from '@metamask/obs-store';
import pify from 'pify';
import BN from 'bn.js';
import createId from '../../../shared/modules/random-id';
import { previousValueComparator } from '../lib/util';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';

import {
  TransactionType,
  TransactionStatus,
} from '../../../shared/constants/transaction';
import { ETHERSCAN_SUPPORTED_NETWORKS } from '../../../shared/constants/network';
import { bnToHex } from '../../../shared/modules/conversion.utils';

const fetchWithTimeout = getFetchWithTimeout();

/**
 * @typedef {import('../../../shared/constants/transaction').TransactionMeta} TransactionMeta
 */

/**
 * A transaction object in the format returned by the Etherscan API.
 *
 * Note that this is not an exhaustive type definiton; only the properties we use are defined
 *
 * @typedef {object} EtherscanTransaction
 * @property {string} blockNumber - The number of the block this transaction was found in, in decimal
 * @property {string} from - The hex-prefixed address of the sender
 * @property {string} gas - The gas limit, in decimal GWEI
 * @property {string} [gasPrice] - The gas price, in decimal WEI
 * @property {string} [maxFeePerGas] - The maximum fee per gas, inclusive of tip, in decimal WEI
 * @property {string} [maxPriorityFeePerGas] - The maximum tip per gas in decimal WEI
 * @property {string} hash - The hex-prefixed transaction hash
 * @property {string} isError - Whether the transaction was confirmed or failed (0 for confirmed, 1 for failed)
 * @property {string} nonce - The transaction nonce, in decimal
 * @property {string} timeStamp - The timestamp for the transaction, in seconds
 * @property {string} to - The hex-prefixed address of the recipient
 * @property {string} value - The amount of ETH sent in this transaction, in decimal WEI
 */

/**
 * This controller is responsible for retrieving incoming transactions. Etherscan is polled once every block to check
 * for new incoming transactions for the current selected account on the current network
 *
 * Note that only Etherscan-compatible networks are supported. We will not attempt to retrieve incoming transactions
 * on non-compatible custom RPC endpoints.
 */
export default class IncomingTransactionsController {
  constructor(opts = {}) {
    const {
      blockTracker,
      onNetworkDidChange,
      getCurrentChainId,
      preferencesController,
      onboardingController,
      providerStore,
      provider,
    } = opts;
    this.blockTracker = blockTracker;
    this.getCurrentChainId = getCurrentChainId;
    this.preferencesController = preferencesController;
    this.onboardingController = onboardingController;
    this.providerStore = providerStore;
    this.provider = provider;
    this._query = pify(new EthQuery(this.provider));

    this._onLatestBlock = async (newBlockNumberHex) => {
      const selectedAddress = this.preferencesController.getSelectedAddress();
      const newBlockNumberDec = parseInt(newBlockNumberHex, 16);
      await this._update(selectedAddress, newBlockNumberDec);
    };

    const incomingTxLastFetchedBlockByChainId = Object.keys(
      ETHERSCAN_SUPPORTED_NETWORKS,
    ).reduce((network, chainId) => {
      network[chainId] = null;
      return network;
    }, {});

    const initState = {
      incomingTransactions: {},
      incomingTxLastFetchedBlockByChainId,
      ...opts.initState,
    };
    this.store = new ObservableStore(initState);

    this.preferencesController.store.subscribe(
      previousValueComparator((prevState, currState) => {
        const {
          featureFlags: {
            showIncomingTransactions: prevShowIncomingTransactions,
          } = {},
        } = prevState;
        const {
          featureFlags: {
            showIncomingTransactions: currShowIncomingTransactions,
          } = {},
        } = currState;

        if (currShowIncomingTransactions === prevShowIncomingTransactions) {
          return;
        }

        if (prevShowIncomingTransactions && !currShowIncomingTransactions) {
          this.stop();
          return;
        }

        this.start();
      }, this.preferencesController.store.getState()),
    );

    this.preferencesController.store.subscribe(
      previousValueComparator(async (prevState, currState) => {
        const { selectedAddress: prevSelectedAddress } = prevState;
        const { selectedAddress: currSelectedAddress } = currState;

        if (currSelectedAddress === prevSelectedAddress) {
          return;
        }
        await this._update(currSelectedAddress);
      }, this.preferencesController.store.getState()),
    );

    this.onboardingController.store.subscribe(
      previousValueComparator(async (prevState, currState) => {
        const { completedOnboarding: prevCompletedOnboarding } = prevState;
        const { completedOnboarding: currCompletedOnboarding } = currState;
        if (!prevCompletedOnboarding && currCompletedOnboarding) {
          const address = this.preferencesController.getSelectedAddress();
          await this._update(address);
        }
      }, this.onboardingController.store.getState()),
    );

    onNetworkDidChange(async () => {
      const address = this.preferencesController.getSelectedAddress();
      await this._update(address);
    });
  }

  start() {
    const { featureFlags = {} } = this.preferencesController.store.getState();
    const { showIncomingTransactions } = featureFlags;

    if (!showIncomingTransactions) {
      return;
    }

    this.blockTracker.removeListener('latest', this._onLatestBlock);
    this.blockTracker.addListener('latest', this._onLatestBlock);
  }

  stop() {
    this.blockTracker.removeListener('latest', this._onLatestBlock);
  }

  /**
   * Determines the correct block number to begin looking for new transactions
   * from, fetches the transactions and then saves them and the next block
   * number to begin fetching from in state. Block numbers and transactions are
   * stored per chainId.
   *
   * @private
   * @param {string} address - address to lookup transactions for
   */
  async _update(address) {
    const addresses = [address];

    const response = await this._query.sendAsync({
      method: 'tol_getTransactionList',
      params: [addresses, 1000],
    });

    const incomingTransactions = response.transactions;

    this.store.updateState({
      incomingTransactions,
    });
  }

  /**
   * Transmutes a EtherscanTransaction into a TransactionMeta
   *
   * @param {EtherscanTransaction} etherscanTransaction - the transaction to normalize
   * @param {string} chainId - The chainId of the current network
   * @returns {TransactionMeta}
   */
  _normalizeTxFromEtherscan(etherscanTransaction, chainId) {
    const time = parseInt(etherscanTransaction.timeStamp, 10) * 1000;
    const status =
      etherscanTransaction.isError === '0'
        ? TransactionStatus.confirmed
        : TransactionStatus.failed;
    const txParams = {
      from: etherscanTransaction.from,
      gas: bnToHex(new BN(etherscanTransaction.gas)),
      nonce: bnToHex(new BN(etherscanTransaction.nonce)),
      to: etherscanTransaction.to,
      value: bnToHex(new BN(etherscanTransaction.value)),
    };

    if (etherscanTransaction.gasPrice) {
      txParams.gasPrice = bnToHex(new BN(etherscanTransaction.gasPrice));
    } else if (etherscanTransaction.maxFeePerGas) {
      txParams.maxFeePerGas = bnToHex(
        new BN(etherscanTransaction.maxFeePerGas),
      );
      txParams.maxPriorityFeePerGas = bnToHex(
        new BN(etherscanTransaction.maxPriorityFeePerGas),
      );
    }

    return {
      blockNumber: etherscanTransaction.blockNumber,
      id: createId(),
      chainId,
      metamaskNetworkId: ETHERSCAN_SUPPORTED_NETWORKS[chainId].networkId,
      status,
      time,
      txParams,
      hash: etherscanTransaction.hash,
      type: TransactionType.incoming,
    };
  }
}
