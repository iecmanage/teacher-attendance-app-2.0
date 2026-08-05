import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, X } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');

      // Auto-validate if length matches expected pin length
      if (nextPin.length === expectedPin.length) {
        if (nextPin === expectedPin) {
          setPin('');
          setError('');
          onSuccess();
        } else {
          setError('Incorrect Admin PIN. Please try again.');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          id="pin-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-950/60 border border-amber-600/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold font-serif text-white">Admin Dashboard Lock</h3>
          <p className="text-xs text-slate-400 mt-1">
            Enter your 4-digit Admin Security PIN to access management tools and reports.
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {Array.from({ length: expectedPin.length }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-500/50'
                  : 'bg-slate-800 border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-center gap-2 justify-center animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              id={`pin-key-${num}`}
              onClick={() => handleKeyPress(num)}
              className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 active:text-white text-slate-200 font-bold text-lg rounded-xl border border-slate-700/60 transition-all flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            id="pin-key-clear"
            onClick={handleClear}
            className="h-12 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl border border-slate-700/60 transition-all flex items-center justify-center"
          >
            Clear
          </button>
          <button
            id="pin-key-0"
            onClick={() => handleKeyPress('0')}
            className="h-12 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 active:text-white text-slate-200 font-bold text-lg rounded-xl border border-slate-700/60 transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            id="pin-key-delete"
            onClick={handleDelete}
            className="h-12 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl border border-slate-700/60 transition-all flex items-center justify-center"
          >
            Delete
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>Default PIN: <strong className="text-slate-300 font-mono">1234</strong> (Editable in Settings)</span>
        </div>
      </div>
    </div>
  );
};
