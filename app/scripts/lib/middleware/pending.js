import { createAsyncMiddleware } from 'json-rpc-engine';
// import { formatTxMetaForRpcResult } from '../util';

export function createPendingNonceMiddleware({ getPendingNonce }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req;

    if (method !== 'tol_getNonce') {
      next();
      return;
    }
    const [param, blockRef] = params;
    if (blockRef !== 'pending') {
      next();
      return;
    }
    res.result = await getPendingNonce(param);

    // if (method !== 'eth_getTransactionCount') {
    //   next();
    //   return;
    // }
    // const [param, blockRef] = params;
    // if (blockRef !== 'pending') {
    //   next();
    //   return;
    // }
    // res.result = await getPendingNonce(param);
  });
}

export function createPendingTxMiddleware({ signTolarTransaction }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req;
    if (method !== 'taq_sendTransaction') {
      next();
      return;
    }
    const [txData] = params;
    const mandatoryFields = [
      'sender_address',
      'receiver_address',
      'amount',
      'gas',
      'gas_price',
      'data',
    ];
    const missingFields = mandatoryFields.reduce((acc, field) => {
      const isFieldIncluded = Object.keys(txData).some(
        (checkField) => field === checkField,
      );
      if (!isFieldIncluded) {
        acc.push(field);
      }
      return acc;
    }, []);
    if (missingFields.length) {
      throw new Error(
        `Please include all required fields in your transaction payload. Missing fields: ${missingFields.toString()}`,
      );
    }

    req.method = 'tol_getNonce';
    const signingResult = await signTolarTransaction(...params);

    try {
      // let userConfirmation = await waitForUserConfirmation();
      res.result = { txData, txHash: signingResult.sig_data.hash };
    } catch (error) {
      throw new Error(
        `User rejected sending transaction: ${signingResult.sig_data.hash}`,
      );
    }
  });
}

// export function createPendingTxMiddleware({ getPendingTransactionByHash }) {
//   return createAsyncMiddleware(async (req, res, next) => {
//     const { method, params } = req;
//     if (method !== 'eth_getTransactionByHash') {
//       next();
//       return;
//     }
//     const [hash] = params;
//     const txMeta = getPendingTransactionByHash(hash);
//     if (!txMeta) {
//       next();
//       return;
//     }
//     res.result = formatTxMetaForRpcResult(txMeta);
//   });
// }
