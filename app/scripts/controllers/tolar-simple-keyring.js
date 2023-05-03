import Web3, { utils } from '@tolar/web3';
import SimpleKeyring from 'eth-simple-keyring';
import log from 'loglevel';

// import { ethAddressToTolarAddress } from '../../tolar-keyring/tolar-keyring';
import {
  NETWORK_TYPE_TO_SUBDOMAIN_MAP,
  NETWORK_TYPE_TO_ID_MAP,
} from '../../../shared/constants/network';

const ethUtil = require('ethereumjs-util');
const sigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet');
// const Account = require("eth-lib/lib/account");
// const elliptic = require("elliptic");
// const secp256k1 = new elliptic.ec("secp256k1");

function ethAddressToTolarAddress(ethAddress) {
  if (!ethAddress) {
    return;
  }
  const prefix = 'T';
  const prefixHex = utils.toHex(prefix).substr(2);

  const addressHash = utils.soliditySha3(ethAddress);
  const hashOfHash = utils.soliditySha3(addressHash);
  const tolarAddress =
    prefixHex + ethAddress.substr(2) + hashOfHash.substr(hashOfHash.length - 8);
  return tolarAddress.toLowerCase();
}

export class TolarSimpleKeyring extends SimpleKeyring {
  // constructor(opts) {
  //   super(opts);

  //   //this.web3 = new Web3("https://testnet-gateway.dev.tolar.io");
  //   //this.web3 = new Web3("https://jsongw.stagenet.tolar.io");

  //   // const fromPrivateFn = Account.fromPrivate;
  //   // const recoverFn = Account.recover;
  //   // Object.assign(Account, {
  //   //   publicKey: (privateKey) => {
  //   //     var buffer = Buffer.from(privateKey.slice(2), "hex");
  //   //     var ecKey = secp256k1.keyFromPrivate(buffer);
  //   //     return ecKey.getPublic(false, "hex").slice(2);
  //   //   },
  //   //   sign: Account.makeSigner(0), // v=27|28 instead of 0|1...;
  //   //   fromPrivate: (privateKey) => {
  //   //     const res = fromPrivateFn(privateKey);
  //   //     return Object.assign(res, {
  //   //       address: ethAddressToTolarAddress(res.address),
  //   //     });
  //   //   },
  //   //   recover: (hash, signature) =>
  //   //     ethAddressToTolarAddress(recoverFn(hash, signature)),
  //   // });
  // }

  updateNetwork(netConfig) {
    const isTolar = Boolean(NETWORK_TYPE_TO_SUBDOMAIN_MAP[netConfig.network]);
    if (isTolar) {
      const tolarRpc = `https://${
        NETWORK_TYPE_TO_SUBDOMAIN_MAP[netConfig.network].subdomain
      }.tolar.io`;
      this.netConfig = netConfig;
      this.web3 = new Web3(tolarRpc);
    } else {
      throw new Error('Unsupported tolar RPC provided');
    }
  }

  getAccounts() {
    log.info(this.wallets, 'wallets');
    return Promise.resolve(
      this.wallets.map((w) =>
        ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())),
      ),
    );
  }

  removeAccount(address) {
    if (
      !this.wallets.find(
        (w) =>
          ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())) ===
          address,
      )
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.wallets = this.wallets.filter(
      (w) =>
        ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())) !==
        address,
    );

    this.wallets = this.wallets.filter((w) => {
      const tolarAddress = ethAddressToTolarAddress(
        ethUtil.bufferToHex(w.getAddress()),
      );

      return tolarAddress !== address.toLowerCase();
    });
  }

  async signTransaction(address, tx, opts = {}) {
    const wallet = this._getWalletForAccount(address, opts);
    const nonce = await this.web3.tolar.getNonce(address);

    const signedTx = await this.web3.tolar.accounts.signTransaction(
      {
        ...tx,
        nonce,
        network_id: NETWORK_TYPE_TO_ID_MAP[this.netConfig.network].networkId,
      },
      wallet.getPrivateKeyString(),
    );

    return signedTx;
  }

  _getWalletForAccount(account, opts = {}) {
    const address = /^54/u.test(account) ? account : sigUtil.normalize(account);
    let wallet = this.wallets.find(
      (w) =>
        ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())) ===
        address,
    );
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching address.');
    }

    if (opts.withAppKeyOrigin) {
      const privKey = wallet.getPrivateKey();
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8');
      const appKeyBuffer = Buffer.concat([privKey, appKeyOriginBuffer]);
      const appKeyPrivKey = ethUtil.keccak(appKeyBuffer, 256);
      wallet = Wallet.fromPrivateKey(appKeyPrivKey);
    }

    return wallet;
  }
}
