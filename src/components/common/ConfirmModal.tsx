import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تایید',
  cancelText = 'انصراف',
  isLoading = false,
  type = 'danger',
}: ConfirmModalProps) => {
  const isDanger = type === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center gap-4 pt-2">
        <div className={`p-4 rounded-full ${isDanger ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
          <AlertTriangle size={32} />
        </div>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">{message}</p>
        
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20'
            }`}
          >
            {isLoading && <Loader2 className="animate-spin" size={20} />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
