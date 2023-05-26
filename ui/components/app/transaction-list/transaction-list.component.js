import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { tolarIncomingTransactions } from '../../../selectors/transactions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import SmartTransactionListItem from '../transaction-list-item/smart-transaction-list-item.component';
import Button from '../../ui/button';

const PAGE_INCREMENT = 10;

export default function TransactionList({
  hideTokenTransactions,
  tokenAddress,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  const tolarTransactions = useSelector(tolarIncomingTransactions);

  const transactions = useMemo(
    () => tolarTransactions.slice(0, limit),
    [limit, tolarTransactions],
  );

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    [],
  );

  return (
    <div className="transaction-list">
      <div className="transaction-list__transactions">
        {tolarTransactions.length > 0 ? (
          <div className="transaction-list__pending-transactions">
            {transactions.map((transaction) => (
              <SmartTransactionListItem
                transactionGroup={transaction}
                key={transaction.transaction_hash}
              />
            ))}
          </div>
        ) : (
          <p className="transaction-list__no-transactions">
            {t('noTransactions')}
          </p>
        )}

        {tolarTransactions.length > limit && (
          <Button
            className="transaction-list__view-more"
            type="primary"
            onClick={viewMore}
          >
            {t('viewMore')}
          </Button>
        )}
      </div>
    </div>
    // </div>
  );
}

TransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
};

TransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
};
