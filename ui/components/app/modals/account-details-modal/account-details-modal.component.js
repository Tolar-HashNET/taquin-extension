import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { getAccountLink } from '@metamask/etherscan-link';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';
import { getURLHostName } from '../../../../helpers/utils/util';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import {
  EVENT,
  EVENT_NAMES,
} from '../../../../../shared/constants/metametrics';
// import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { TOLAR_EXPLORER_URL } from '../../../../../shared/constants/network';

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    chainId: PropTypes.string,
    showExportPrivateKeyModal: PropTypes.func,
    setAccountLabel: PropTypes.func,
    keyrings: PropTypes.array,
    rpcPrefs: PropTypes.object,
    accounts: PropTypes.array,
    history: PropTypes.object,
    hideModal: PropTypes.func,
    network: PropTypes.string,
    blockExplorerLinkText: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  render() {
    const {
      selectedIdentity,
      chainId,
      showExportPrivateKeyModal,
      setAccountLabel,
      keyrings,
      rpcPrefs,
      history,
      hideModal,
      network,
      blockExplorerLinkText,
    } = this.props;
    const { name, address } = selectedIdentity;

    console.log(network);

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(address);
    });

    let exportPrivateKeyFeatureEnabled = true;
    // This feature is disabled for hardware wallets
    if (isHardwareKeyring(keyring?.type)) {
      exportPrivateKeyFeatureEnabled = false;
    }

    // const routeToAddBlockExplorerUrl = () => {
    //   hideModal();
    //   history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
    // };

    const openBlockExplorer = () => {
      const accountLink = TOLAR_EXPLORER_URL(network, address);
      // const accountLink = getAccountLink(address, chainId, rpcPrefs);
      this.context.trackEvent({
        category: EVENT.CATEGORIES.NAVIGATION,
        event: EVENT_NAMES.EXTERNAL_LINK_CLICKED,
        properties: {
          link_type: EVENT.EXTERNAL_LINK_TYPES.ACCOUNT_TRACKER,
          location: 'Account Details Modal',
          url_domain: getURLHostName(accountLink),
        },
      });
      global.platform.openTab({
        url: accountLink,
      });
    };

    return (
      <AccountModalContainer className="account-details-modal">
        {/* <EditableLabel
          className="account-details-modal__name"
          defaultValue={name}
          onSubmit={(label) => setAccountLabel(address, label)}
          accounts={this.props.accounts}
        /> */}

        <p className="account-details-modal__name">{name}</p>

        <QrView
          Qr={{
            data: address,
          }}
        />

        <div className="account-details-modal__divider" />

        <Button
          type="primary"
          className="account-details-modal__button"
          onClick={openBlockExplorer}
        >
          Explorer
          {/* {this.context.t(blockExplorerLinkText.firstPart, [
            blockExplorerLinkText.secondPart,
          ])} */}
        </Button>

        {exportPrivateKeyFeatureEnabled && (
          <Button
            type="primary"
            className="account-details-modal__button"
            onClick={() => {
              this.context.trackEvent({
                category: EVENT.CATEGORIES.ACCOUNTS,
                event: EVENT_NAMES.KEY_EXPORT_SELECTED,
                properties: {
                  key_type: EVENT.KEY_TYPES.PKEY,
                  location: 'Account Details Modal',
                },
              });
              showExportPrivateKeyModal();
            }}
          >
            {this.context.t('exportPrivateKey')}
          </Button>
        )}
      </AccountModalContainer>
    );
  }
}
