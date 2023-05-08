import { useSelector } from 'react-redux';
import BN from 'bn.js';

import { getSelectedAddress } from '../selectors/selectors';
import { formatDateWithYearContext } from '../helpers/utils/util';

import { NETWORK_ID_TO_TYPE_MAP } from '../../shared/constants/network';

export function useTolarTransactionDisplayData(transaction) {
  const address = useSelector(getSelectedAddress);
  const {
    value,
    confirmation_timestamp: confirmationDate,
    network_id: networkId,
    sender_address: senderAddress,
    receiver_address: receiverAddress,
    transaction_hash: transactionHash,
  } = transaction;

  const date = formatDateWithYearContext(confirmationDate || 0);

  const networkType = NETWORK_ID_TO_TYPE_MAP[networkId];
  const category = senderAddress === address ? 'sent-tx' : 'received-tx';

  const exploreUrl = `https://web-explorer.${networkType}.tolar.io/?query=${transactionHash}&page=1`;

  const parseTolarDisplay = (val) => {
    if (!val) {
      return 0;
    }
    const bnVal = new BN(val.toString());

    return `${
      bnVal ? bnVal.divRound(new BN(1e15)).toNumber() / 1000 : val
    } TOL`;
  };

  const transactionValue = parseTolarDisplay(value);

  return {
    category,
    date,
    transactionValue,
    senderAddress,
    receiverAddress,
    transactionHash,
    exploreUrl,
  };
}
