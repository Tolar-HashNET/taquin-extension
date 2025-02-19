// /*global Web3*/

// TODO:deprecate:2020
// Delete this file

// import "web3/dist/web3.min";
import Web3 from '@tolar/web3/dist/web3.min';

// const shouldLogUsage = ![
//   'docs.taquin.io',
//   'taquin.github.io',
//   'taquin.io',
// ].includes(window.location.hostname);

export default function setupWeb3(log) {
  // export web3 as a global, checking for usage
  let reloadInProgress = false;
  let lastTimeUsed;
  let lastSeenNetwork;
  let hasBeenWarned = false;

  const web3 = new Web3(window.tolar);
  web3.setProvider = function () {
    log.debug('Taquin - overrode web3.setProvider');
  };
  log.debug('Taquin - injected web3');

  Object.defineProperty(window.tolar, '_web3Ref', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: web3.tolar,
  });

  const web3Proxy = new Proxy(web3, {
    get: (_web3t, key) => {
      // get the time of use
      lastTimeUsed = Date.now();
      // show warning once on web3 access
      if (!hasBeenWarned) {
        console.warn(
          `Taquin: We will stop injecting web3 in Q4 2020.\nPlease see this article for more information: https://medium.com/taquin/no-longer-injecting-web3-js-4a899ad6e59e`,
        );
        hasBeenWarned = true;
      }

      // if (shouldLogUsage) {
      //   const name = stringifyKey(key)
      //   window.tolar.request({
      //     method: 'taquin_logInjectedWeb3Usage',
      //     params: [{ action: 'window.web3 get', name }],
      //   })
      // }

      // return value normally
      return _web3t[key];
    },
    set: (_web3t, key, value) => {
      // const name = stringifyKey(key);
      // if (shouldLogUsage) {
      //   window.tolar.request({
      //     method: 'taquin_logInjectedWeb3Usage',
      //     params: [{ action: 'window.web3 set', name }],
      //   })
      // }

      // set value normally
      _web3t[key] = value;
    },
  });

  Object.defineProperty(global, 'web3t', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: web3Proxy,
  });

  window.tolar._publicConfigStore.subscribe((state) => {
    // if the auto refresh on network change is false do not
    // do anything
    if (!window.tolar.autoRefreshOnNetworkChange) {
      return;
    }

    // if reload in progress, no need to check reload logic
    if (reloadInProgress) {
      return;
    }

    const currentNetwork = state.networkVersion;

    // set the initial network
    if (!lastSeenNetwork) {
      lastSeenNetwork = currentNetwork;
      return;
    }

    // skip reload logic if web3 not used
    if (!lastTimeUsed) {
      return;
    }

    // if network did not change, exit
    if (currentNetwork === lastSeenNetwork) {
      return;
    }

    // initiate page reload
    reloadInProgress = true;
    const timeSinceUse = Date.now() - lastTimeUsed;
    // if web3 was recently used then delay the reloading of the page
    if (timeSinceUse > 500) {
      triggerReset();
    } else {
      setTimeout(triggerReset, 500);
    }
  });
}

// reload the page
function triggerReset() {
  // global.location.reload();
}

/**
 * Returns a "stringified" key. Keys that are already strings are returned
 * unchanged, and any non-string values are returned as "typeof <type>".
 *
 * @param {any} key - The key to stringify
 */
// function stringifyKey(key) {
//   return typeof key === 'string' ? key : `typeof ${typeof key}`;
// }
