import { App } from 'vue';
import Modal, { destroyFns, ModalFunc, ModalFuncProps } from './Modal';
import modalConfirm from './confirm';
import InfoCircleOutlined from '@ant-design/icons-vue/InfoCircleOutlined';
import CheckCircleOutlined from '@ant-design/icons-vue/CheckCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons-vue/CloseCircleOutlined';
import ExclamationCircleOutlined from '@ant-design/icons-vue/ExclamationCircleOutlined';

export { IActionButtonProps as ActionButtonProps } from './ActionButton';
export { ModalProps, ModalFuncProps } from './Modal';

const info = function(props: ModalFuncProps) {
  const config = {
    type: 'info',
    icon: <InfoCircleOutlined />,
    okCancel: false,
    ...props,
  };
  return modalConfirm(config);
};

const success = function(props: ModalFuncProps) {
  const config = {
    type: 'success',
    icon: <CheckCircleOutlined />,
    okCancel: false,
    ...props,
  };
  return modalConfirm(config);
};

const error = function(props: ModalFuncProps) {
  const config = {
    type: 'error',
    icon: <CloseCircleOutlined />,
    okCancel: false,
    ...props,
  };
  return modalConfirm(config);
};

const warning = function(props: ModalFuncProps) {
  const config = {
    type: 'warning',
    icon: <ExclamationCircleOutlined />,
    okCancel: false,
    ...props,
  };
  return modalConfirm(config);
};
const warn = warning;

const confirm = function confirmFn(props: ModalFuncProps) {
  const config = {
    type: 'confirm',
    okCancel: true,
    ...props,
  };
  return modalConfirm(config);
};
Modal.info = info;
Modal.success = success;
Modal.error = error;
Modal.warning = warning;
Modal.warn = warn;
Modal.confirm = confirm;

Modal.destroyAll = function destroyAllFn() {
  while (destroyFns.length) {
    const close = destroyFns.pop();
    if (close) {
      close();
    }
  }
};

/* istanbul ignore next */
Modal.install = function(app: App) {
  app.component(Modal.name, Modal);
  return app;
};

export default Modal as typeof Modal & {
  readonly info: ModalFunc;

  readonly success: ModalFunc;

  readonly error: ModalFunc;

  readonly warn: ModalFunc;

  readonly warning: ModalFunc;

  readonly confirm: ModalFunc;

  readonly destroyAll: () => void;
};
