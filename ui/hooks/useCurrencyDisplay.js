import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import BN from 'bn.js';
// import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getCurrentCurrency } from '../selectors';
// import {
//   getConversionRate,
//   getNativeCurrency,
// } from '../ducks/metamask/metamask';

// import { getValueFromWeiHex } from '../../shared/modules/conversion.utils';
// import { TEST_NETWORK_TICKER_MAP } from '../../shared/constants/network';
// import { Numeric } from '../../shared/modules/Numeric';
// import { EtherDenomination } from '../../shared/constants/common';

export function parseTolarDisplay(val) {
  if (!val) {
    return 0;
  }
  const bnVal = new BN(val.toString());

  return bnVal ? bnVal.divRound(new BN(1e15)).toNumber() / 1000 : val;
}

/**
 * Defines the shape of the options parameter for useCurrencyDisplay
 *
 * @typedef {object} UseCurrencyOptions
 * @property {string} [displayValue] - When present is used in lieu of formatting the inputValue
 * @property {string} [prefix] - String to prepend to the final result
 * @property {number} [numberOfDecimals] - Number of significant decimals to display
 * @property {string} [denomination] - Denomination (wei, gwei) to convert to for display
 * @property {string} [currency] - Currency type to convert to. Will override nativeCurrency
 */

/**
 * Defines the return shape of the second value in the tuple
 *
 * @typedef {object} CurrencyDisplayParts
 * @property {string} [prefix] - string to prepend to the value for display
 * @property {string} value - string representing the value, formatted for display
 * @property {string} [suffix] - string to append to the value for display
 */

/**
 * useCurrencyDisplay hook
 *
 * Given a hexadecimal encoded value string and an object of parameters used for formatting the
 * display, produce both a fully formed string and the pieces of that string used for displaying
 * the currency to the user
 *
 * @param {string} inputValue - The value to format for display
 * @param {UseCurrencyOptions} opts - An object for options to format the inputValue
 * @returns {[string, CurrencyDisplayParts]}
 */
export function useCurrencyDisplay(
  inputValue,
  { displayValue, prefix, numberOfDecimals, denomination, currency, ...opts },
) {
  const currentCurrency = useSelector(getCurrentCurrency);
  // const nativeCurrency = useSelector(getNativeCurrency);
  // const conversionRate = useSelector(getConversionRate);

  // const toCurrency = currency || currentCurrency;
  // const isUserPreferredCurrency = currency === currentCurrency;

  const value = useMemo(() => {
    return parseTolarDisplay(inputValue);
    // if (displayValue) {
    //   return displayValue;
    // }
    // if (
    //   currency === nativeCurrency ||
    //   (!isUserPreferredCurrency && !nativeCurrency)
    // ) {
    //   return new Numeric(inputValue, 16, EtherDenomination.WEI)
    //     .toDenomination(denomination || EtherDenomination.ETH)
    //     .round(numberOfDecimals || 2)
    //     .toBase(10)
    //     .toString();
    // } else if (isUserPreferredCurrency && conversionRate) {
    //   return formatCurrency(
    //     getValueFromWeiHex({
    //       value: inputValue,
    //       fromCurrency: nativeCurrency,
    //       toCurrency: currency,
    //       conversionRate,
    //       numberOfDecimals: numberOfDecimals || 2,
    //       toDenomination: denomination,
    //     }),
    //     currency,
    //   );
    // }
    // return null;
    // formatCurrency(inputValue, toCurrency);
  }, [
    inputValue,
    // nativeCurrency,
    // conversionRate,
    // displayValue,
    // numberOfDecimals,
    // denomination,
    // currency,
    // isUserPreferredCurrency,
  ]);

  // let suffix;

  // if (!opts.hideLabel) {
  //   // if the currency we are displaying is the native currency of one of our preloaded test-nets (goerli, sepolia etc.)
  //   // then we allow lowercase characters, otherwise we force to uppercase any suffix passed as a currency
  //   const currencyTickerSymbol = Object.values(
  //     TEST_NETWORK_TICKER_MAP,
  //   ).includes(currency)
  //     ? currency
  //     : currency?.toUpperCase();

  //   suffix = opts.suffix || currencyTickerSymbol;
  // }
  const suffix = 'TOL';

  return [
    `${prefix || ''}${value}${suffix ? ` ${suffix}` : ''}`,
    { prefix, value, suffix },
  ];
}
