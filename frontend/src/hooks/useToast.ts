import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string, duration: number = 4000) => {
    toast.success(message, {
      duration,
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  const showError = (message: string, duration: number = 5000) => {
    toast.error(message, {
      duration,
      style: {
        background: '#EF4444',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#3B82F6',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  const dismissLoading = (toastId: string) => {
    toast.dismiss(toastId);
  };

  const showInfo = (message: string, duration: number = 3000) => {
    toast(message, {
      icon: 'ℹ️',
      duration,
      style: {
        background: '#6B7280',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  const showWarning = (message: string, duration: number = 4000) => {
    toast(message, {
      icon: '⚠️',
      duration,
      style: {
        background: '#F59E0B',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  const showCustom = (message: string, icon: string, duration: number = 3000) => {
    toast(message, {
      icon,
      duration,
      style: {
        background: '#6366F1',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  return {
    showSuccess,
    showError,
    showLoading,
    dismissLoading,
    showInfo,
    showWarning,
    showCustom,
  };
}; 