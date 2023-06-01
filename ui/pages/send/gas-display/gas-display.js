import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
// import classNames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
// import { useGasFeeContext } from '../../../contexts/gasFee';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
// import GasTiming from '../../../components/app/gas-timing';
import InfoTooltip from '../../../components/ui/info-tooltip';
import Typography from '../../../components/ui/typography';
// import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import {
  TypographyVariant,
  DISPLAY,
  FLEX_DIRECTION,
  BLOCK_SIZES,
  Color,
  FONT_STYLE,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { TokenStandard } from '../../../../shared/constants/transaction';
// import LoadingHeartBeat from '../../../components/ui/loading-heartbeat';
import TransactionDetailItem from '../../../components/app/transaction-detail-item';
// import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import TransactionDetail from '../../../components/app/transaction-detail';
// import ActionableMessage from '../../../components/ui/actionable-message';
import {
  // getProvider,
  getPreferences,
  // getIsBuyableChain,
  transactionFeeSelector,
  getIsMainnet,
  // getIsTestnet,
  // getUseCurrencyRateCheck,
} from '../../../selectors';

import { INSUFFICIENT_TOKENS_ERROR } from '../send.constants';
import { getCurrentDraftTransaction } from '../../../ducks/send';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
// import { showModal } from '../../../store/actions';
import {
  // addHexes,
  hexWEIToDecETH,
  // hexWEIToDecGWEI,
} from '../../../../shared/modules/conversion.utils';
// import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
// import { MetaMetricsContext } from '../../../contexts/metametrics';
// import useRamps from '../../../hooks/experiences/useRamps';

export default function GasDisplay({ gasError }) {
  const t = useContext(I18nContext);
  // const dispatch = useDispatch();
  // const { estimateUsed } = useGasFeeContext();
  // const trackEvent = useContext(MetaMetricsContext);

  // const { openBuyCryptoInPdapp } = useRamps();

  // const currentProvider = useSelector(getProvider);
  const isMainnet = useSelector(getIsMainnet);
  // const isTestnet = useSelector(getIsTestnet);
  // const isBuyableChain = useSelector(getIsBuyableChain);
  const draftTransaction = useSelector(getCurrentDraftTransaction);
  // const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { showFiatInTestnets, useNativeCurrencyAsPrimaryCurrency } =
    useSelector(getPreferences);
  const { provider, unapprovedTxs } = useSelector((state) => state.metamask);
  const nativeCurrency = useSelector(getNativeCurrency);
  // const { chainId } = provider;
  // const networkName = NETWORK_TO_NAME_MAP[chainId];
  const isInsufficientTokenError =
    draftTransaction?.amount.error === INSUFFICIENT_TOKENS_ERROR;
  const editingTransaction = unapprovedTxs[draftTransaction.id];
  // const currentNetworkName = networkName || currentProvider.nickname;

  const transactionData = {
    txParams: {
      gasPrice: draftTransaction.gas?.gasPrice,
      gas: editingTransaction?.userEditedGasLimit
        ? editingTransaction?.txParams?.gas
        : draftTransaction.gas?.gasLimit,
      maxFeePerGas: editingTransaction?.txParams?.maxFeePerGas
        ? editingTransaction?.txParams?.maxFeePerGas
        : draftTransaction.gas?.maxFeePerGas,
      maxPriorityFeePerGas: editingTransaction?.txParams?.maxPriorityFeePerGas
        ? editingTransaction?.txParams?.maxPriorityFeePerGas
        : draftTransaction.gas?.maxPriorityFeePerGas,
      value: draftTransaction.amount?.value,
      type: draftTransaction.transactionType,
    },
    userFeeLevel: editingTransaction?.userFeeLevel,
  };

  const {
    hexMinimumTransactionFee,
    hexMaximumTransactionFee,
    hexTransactionTotal,
  } = useSelector((state) => transactionFeeSelector(state, transactionData));

  let title;
  if (
    draftTransaction?.asset.details?.standard === TokenStandard.ERC721 ||
    draftTransaction?.asset.details?.standard === TokenStandard.ERC1155
  ) {
    title = draftTransaction?.asset.details?.name;
  } else if (
    draftTransaction?.asset.details?.standard === TokenStandard.ERC20
  ) {
    title = `${hexWEIToDecETH(draftTransaction.amount.value)} ${
      draftTransaction?.asset.details?.symbol
    }`;
  }

  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  );

  const primaryTotalTextOverrideMaxAmount = `${title} + ${ethTransactionTotalMaxAmount} ${nativeCurrency}`;

  let detailTotal;

  if (draftTransaction?.asset.type === 'NATIVE') {
    detailTotal = (
      <Box
        height={BLOCK_SIZES.MAX}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        className="gas-display__total-value"
      >
        <UserPreferencedCurrencyDisplay
          type={PRIMARY}
          key="total-detail-value"
          value={hexTransactionTotal}
          hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          diameter={24}
          showIcon={false}
        />
      </Box>
    );
  } else if (useNativeCurrencyAsPrimaryCurrency) {
    detailTotal = primaryTotalTextOverrideMaxAmount;
  }

  return (
    <>
      <Box className="gas-display">
        <TransactionDetail
          userAcknowledgedGasMissing={false}
          rows={[
            <TransactionDetailItem
              key="gas-item"
              detailTitle={
                <Box display={DISPLAY.FLEX}>
                  <Box marginRight={1}>{t('gas')}</Box>
                  <Typography
                    as="span"
                    marginTop={0}
                    color={Color.textMuted}
                    fontStyle={FONT_STYLE.ITALIC}
                    fontWeight={FONT_WEIGHT.NORMAL}
                    className="gas-display__title__estimate"
                  >
                    ({t('transactionDetailGasInfoV2')})
                  </Typography>
                  <InfoTooltip
                    contentText={
                      <>
                        <Typography variant={TypographyVariant.H7}>
                          {t('transactionDetailGasTooltipIntro', [
                            isMainnet ? t('networkNameEthereum') : '',
                          ])}
                        </Typography>
                        <Typography variant={TypographyVariant.H7}>
                          {t('transactionDetailGasTooltipExplanation')}
                        </Typography>
                        <Typography variant={TypographyVariant.H7}>
                          <a
                            href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('transactionDetailGasTooltipConversion')}
                          </a>
                        </Typography>
                      </>
                    }
                    position="right"
                  />
                </Box>
              }
              detailTitleColor={Color.textDefault}
              detailTotal={
                <Box className="gas-display__currency-container">
                  <UserPreferencedCurrencyDisplay
                    type={PRIMARY}
                    value={hexMinimumTransactionFee}
                    hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                    diameter={24}
                    showIcon={false}
                  />
                </Box>
              }
            />,
            (gasError || isInsufficientTokenError) && (
              <TransactionDetailItem
                key="total-item"
                detailTitle={t('total')}
                detailTotal={detailTotal}
              />
            ),
          ]}
        />
      </Box>
    </>
  );
}
GasDisplay.propTypes = {
  gasError: PropTypes.string,
};
