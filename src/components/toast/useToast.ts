import * as React from 'react';
import { ToastContext, ToastContextType } from './ToastContext';

export const useToast: () => ToastContextType = () => {
  const { addToast, removeToast } = React.useContext(ToastContext);
  return { addToast, removeToast };
};
