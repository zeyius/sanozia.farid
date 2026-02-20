import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmNavigationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Reusable modal component to confirm navigation when leaving a form with unsaved changes
 * 
 * @example
 * <ConfirmNavigationModal
 *   isOpen={showConfirm}
 *   onConfirm={() => navigate('/dashboard')}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export function ConfirmNavigationModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Données non sauvegardées',
  message = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter cette page ?',
  confirmText = 'Quitter sans sauvegarder',
  cancelText = 'Continuer la saisie'
}: ConfirmNavigationModalProps) {
  // Disable scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal card */}
      <div className="relative bg-gradient-to-br from-[#f6e6d6] to-[#f9eddf] rounded-2xl shadow-2xl border-2 border-[#e3c79f]/50 w-full max-w-md">
        {/* Content wrapper with white overlay */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-5">
          {/* Icon and title */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-md">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-[#303d25] mb-2">
                {title}
              </h3>
              <p className="text-sm text-[#303d25]/70 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 flex-col-reverse sm:flex-row pt-2">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              variant="outline"
              className="flex-1 border-2 border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 hover:text-red-700"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

