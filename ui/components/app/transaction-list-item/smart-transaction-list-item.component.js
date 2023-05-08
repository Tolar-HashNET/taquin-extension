import React from 'react';
import PropTypes from 'prop-types';
import { useTolarTransactionDisplayData } from '../../../hooks/useTolarTransactionDisplayData';

export default function SmartTransactionListItem({ transactionGroup }) {
  const {
    category,
    date,
    transactionValue,
    senderAddress,
    receiverAddress,
    transactionHash,
    exploreUrl,
  } = useTolarTransactionDisplayData(transactionGroup);

  return (
    <article className="transaction">
      <header className="transaction__header">
        <p className="t t--dimmed">{date}</p>
        {category === 'sent-tx' ? (
          <span className="transaction__header__type transaction__header__type--otcoming">
            Outgoing
          </span>
        ) : (
          <span className="transaction__header__type transaction__header__type--incoming">
            Incoming
          </span>
        )}
      </header>

      <section className="transaction__content">
        <div className="transaction__content__address s--right-tiny">
          <a
            className="t t--action s--bottom-small t--elipsis"
            href={exploreUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {transactionHash}
          </a>
          <p className="t t--elipsis">
            {category === 'sent-tx' ? (
              <>
                <span className="t--dimmed s--right-tiny">To:</span>{' '}
                {receiverAddress}
              </>
            ) : (
              <>
                <span className="t--dimmed s--right-tiny">From:</span>{' '}
                {senderAddress}
              </>
            )}
          </p>
        </div>
        <div className="transaction__content__price">
          <p className="t t--large">{transactionValue}</p>
        </div>
      </section>
    </article>
  );
}

SmartTransactionListItem.propTypes = {
  transactionGroup: PropTypes.object,
};
