import { useState, useCallback, useEffect, useRef } from 'react';

export function useModal() {
  const [modals, setModals] = useState({});

  const openModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

  const isOpen = useCallback((name) => !!modals[name], [modals]);

  return { modals, openModal, closeModal, isOpen };
}
