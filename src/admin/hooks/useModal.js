import { useState } from 'react';

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
  });

  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
  });

  const showModal = (title, message, type = 'info', onConfirm = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  const showSuccess = (message) => {
    setToast({
      isOpen: true,
      message,
    });
  };

  const showError = (message, title = 'Error') => {
    showModal(title, message, 'error');
  };

  const showInfo = (message, title = 'Información') => {
    showModal(title, message, 'info');
  };

  const showConfirm = (message, onConfirm, title = 'Confirmar') => {
    showModal(title, message, 'info', onConfirm);
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    modal,
    toast,
    showModal,
    showSuccess,
    showError,
    showInfo,
    showConfirm,
    closeModal,
    closeToast,
  };
};
