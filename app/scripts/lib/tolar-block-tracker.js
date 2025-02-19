import { PollingBlockTracker } from 'eth-block-tracker';

const pify = require('pify');

export default class TolarBlockTracker extends PollingBlockTracker {
  async _fetchLatestBlock() {
    const reqInfo = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tol_getBlockCount',
      params: [],
    };
    if (this._setSkipCacheFlag) {
      reqInfo.skipCache = true;
    }
    const resInfo = await pify((cb) => this._provider.sendAsync(reqInfo, cb))();
    const { result } = resInfo;
    const req = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tol_getBlockByIndex',
      params: [result - 1],
    };
    if (this._setSkipCacheFlag) {
      req.skipCache = true;
    }
    // const res = await pify((cb) => this._provider.sendAsync(req, cb))();
    if (resInfo.error) {
      throw new Error(
        `PollingBlockTracker - encountered error fetching block:\n${resInfo.error}`,
      );
    }

    return { block_index: result - 1 }; // res.result;
  }
}
