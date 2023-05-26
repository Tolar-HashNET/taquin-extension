import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import {
  ButtonPrimary,
  ButtonSecondary,
  BUTTON_SECONDARY_SIZES,
} from '../../../components/component-library';
import Box from '../../../components/ui/box/box';
// import { Button } from '../../../components/ui/button';
import { DISPLAY } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';
import Button from '../../../components/ui/button';

BottomButtons.propTypes = {
  importAccountFunc: PropTypes.func.isRequired,
  isPrimaryDisabled: PropTypes.bool.isRequired,
};

export default function BottomButtons({
  importAccountFunc,
  isPrimaryDisabled,
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Box display={DISPLAY.FLEX} gap={4}>
      <Button
        type="secondary"
        onClick={() => {
          dispatch(actions.hideWarning());
          window.history.back();
        }}
      >
        {t('cancel')}
      </Button>

      <Button
        type="primary"
        onClick={importAccountFunc}
        disabled={isPrimaryDisabled}
      >
        {t('import')}
      </Button>
      {/* <ButtonSecondary
        onClick={() => {
          dispatch(actions.hideWarning());
          window.history.back();
        }}
        size={BUTTON_SECONDARY_SIZES.LG}
        block
      >
        {t('cancel')}
      </ButtonSecondary> */}
      {/* <ButtonPrimary
        onClick={importAccountFunc}
        disabled={isPrimaryDisabled}
        size={BUTTON_SECONDARY_SIZES.LG}
        block
      >
        {t('import')}
      </ButtonPrimary> */}
    </Box>
  );
}
