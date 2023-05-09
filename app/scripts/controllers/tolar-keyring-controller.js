// import bip39 from 'bip39';
// import KeyringController from 'eth-keyring-controller';
import { KeyringController } from 'eth-keyring-controller';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import { TolarSimpleKeyring as SimpleKeyring } from './tolar-simple-keyring';
import TolarKeyring from './tolar-keyring';

const HdKeyring = require('eth-hd-keyring');
const { normalize: normalizeAddress } = require('eth-sig-util');

// const keyringTypes = [SimpleKeyring];

const keyringTypes = [SimpleKeyring, HdKeyring, TolarKeyring];

export class TolarKeyringController extends KeyringController {
  constructor(opts) {
    super(opts);
    this.store = new ObservableStore(opts.initState);
    this.keyringTypes = opts.keyringTypes
      ? keyringTypes.concat(opts.keyringTypes)
      : keyringTypes;
    this.web3 = opts.web3;
  }

  updateNetwork(netConfig) {
    for (let i = 0; i < this.keyrings.length; i++) {
      this.keyrings[i].updateNetwork(netConfig);
    }
  }

  addNewAccount(selectedKeyring) {
    return selectedKeyring
      .addAccounts(1)
      .then((accounts) => {
        accounts.forEach((hexAccount) => {
          this.emit('newAccount', hexAccount);
        });
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this._updateMemStoreKeyrings.bind(this))
      .then(this.fullUpdate.bind(this));
  }

  persistAllKeyrings(password = this.password) {
    if (typeof password !== 'string') {
      return Promise.reject(
        new Error('KeyringController - password is not a string'),
      );
    }

    this.password = password;
    return Promise.all(
      this.keyrings.map((keyring) => {
        return Promise.all([keyring.type, keyring.serialize()]).then(
          (serializedKeyringArray) => {
            // Label the output values on each serialized Keyring:
            return {
              type: serializedKeyringArray[0],
              data: serializedKeyringArray[1],
            };
          },
        );
      }),
    )
      .then((serializedKeyrings) => {
        return this.encryptor.encrypt(this.password, serializedKeyrings);
      })
      .then((encryptedString) => {
        this.store.updateState({ vault: encryptedString });
        return true;
      });
  }

  getKeyringsByType(type) {
    return this.keyrings.filter((keyring) => keyring.type === type);
  }

  getKeyringClassForType(type) {
    return this.keyringTypes.find((kr) => kr.type === type);
  }

  addNewKeyring(type, opts, password) {
    const Keyring = this.getKeyringClassForType(type);
    log.info(Keyring);
    const keyring = new Keyring(opts);

    return keyring
      .getAccounts()
      .then((accounts) => {
        return this.checkForDuplicate(type, accounts);
      })
      .then(() => {
        this.keyrings.push(keyring);
        return this.persistAllKeyrings(password);
      })
      .then(() => this._updateMemStoreKeyrings())
      .then(() => this.fullUpdate())
      .then(() => {
        return keyring;
      });
  }

  createFirstKeyTree(password) {
    log.info(password);
    this.clearKeyrings();
    return this.addNewKeyring(
      'Tolar Keyring',
      { numberOfAccounts: 1 },
      password,
    )
      .then((keyring) => {
        log.info(keyring, 'keyring');
        return keyring.getAccounts();
      })
      .then(([firstAccount], ...res) => {
        log.info(res);
        if (!firstAccount) {
          throw new Error(
            `KeyringController - No account found on keychain.1, ${firstAccount} first`,
            firstAccount,
          );
        }
        const hexAccount = /^54/u.test(firstAccount)
          ? firstAccount
          : normalizeAddress(firstAccount);
        this.emit('newVault', hexAccount);
        return null;
      });
  }

  async getAccounts() {
    const keyrings = this.keyrings || [];
    const addrs = await Promise.all(
      keyrings.map((kr) => kr.getAccounts()),
    ).then((keyringArrays) => {
      return keyringArrays.reduce((res, arr) => {
        return res.concat(arr);
      }, []);
    });
    // TODO CLEANUP remove normalize for tolar only and improve testing for tolar addresses
    return addrs.map((address) =>
      /^54/u.test(address) ? address : normalizeAddress(address),
    );
  }

  signTransaction(ethTx, _fromAddress, opts = {}) {
    const fromAddress = /^54/u.test(_fromAddress)
      ? _fromAddress
      : normalizeAddress(_fromAddress);
    return this.getKeyringForAccount(fromAddress).then((keyring) => {
      return keyring.signTransaction(fromAddress, ethTx, opts);
    });
  }

  exportAccount(address) {
    try {
      return this.getKeyringForAccount(address).then((keyring) => {
        return keyring.exportAccount(
          /^54/u.test(address) ? address : normalizeAddress(address),
        );
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getAppKeyAddress(_address, origin) {
    const address = /^54/u.test(_address)
      ? _address
      : normalizeAddress(_address);

    const keyring = await this.getKeyringForAccount(address);
    return keyring.getAppKeyAddress(address, origin);
  }

  removeAccount(address) {
    return this.getKeyringForAccount(address)
      .then((keyring) => {
        // Not all the keyrings support this, so we have to check
        if (typeof keyring.removeAccount === 'function') {
          keyring.removeAccount(address);
          this.emit('removedAccount', address);
          return keyring.getAccounts();
        }
        return Promise.reject(
          new Error(
            `Keyring ${keyring.type} doesn't support account removal operations`,
          ),
        );
      })
      .then((accounts) => {
        // Check if this was the last/only account
        if (accounts.length === 0) {
          return this.removeEmptyKeyrings();
        }
        return undefined;
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this._updateMemStoreKeyrings.bind(this))
      .then(this.fullUpdate.bind(this))
      .catch((e) => {
        return Promise.reject(e);
      });
  }

  getKeyringForAccount(address) {
    // const hexed = /^54/.test(address) ? address : normalizeAddress(address);

    // log.debug(`KeyringController - getKeyringForAccount: ${hexed}`);

    return Promise.all(
      this.keyrings.map((keyring) => {
        return Promise.all([keyring, keyring.getAccounts()]);
      }),
    ).then((candidates) => {
      const winners = candidates.filter((candidate) => {
        const accounts = candidate[1];
        return accounts.includes(address);
      });
      if (winners && winners.length > 0) {
        return winners[0][0];
      }
      throw new Error('No keyring found for the requested account.');
    });
  }

  displayForKeyring(keyring) {
    return keyring.getAccounts().then((accounts) => {
      return {
        type: keyring.type,
        accounts: accounts.map((_address) =>
          /^54/u.test(_address) ? _address : normalizeAddress(_address),
        ),
      };
    });
  }

  createNewVaultAndRestore(password, seed) {
    if (typeof password !== 'string') {
      return Promise.reject(new Error('Password must be text.'));
    }
    // if (!bip39.validateMnemonic(seed)) {
    //   return Promise.reject(new Error('Seed phrase is invalid.'));
    // }

    this.clearKeyrings();

    return this.persistAllKeyrings(password)
      .then(() => {
        return this.addNewKeyring(
          'Tolar Keyring',
          {
            mnemonic: seed,
            numberOfAccounts: 1,
          },
          password,
        );
      })
      .then((firstKeyring) => {
        return firstKeyring.getAccounts();
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error('KeyringController - First Account not found.');
        }
        return null;
      })
      .then(this.persistAllKeyrings.bind(this, password))
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this));
  }

  createNewVaultAndKeychain(password) {
    return this.persistAllKeyrings(password)
      .then(this.createFirstKeyTree.bind(this, password))
      .then(this.persistAllKeyrings.bind(this, password))
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this));
  }

  fullUpdate() {
    this.emit('update', this.memStore.getState());
    return this.memStore.getState();
  }

  submitPassword(password) {
    return this.unlockKeyrings(password).then((keyrings) => {
      this.keyrings = keyrings;
      this.setUnlocked();
      return this.fullUpdate();
    });
  }
}
