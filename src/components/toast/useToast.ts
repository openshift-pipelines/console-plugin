import { useContext } from 'react';
import { ToastContext, ToastContextType } from './ToastContext';

export const useToast: () => ToastContextType = () => {
  const { addToast, removeToast } = useContext(ToastContext);
  return { addToast, removeToast };
};
