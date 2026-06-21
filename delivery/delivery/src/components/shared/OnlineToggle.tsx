import React from 'react';

interface OnlineToggleProps {
  isOnline: boolean;
  onToggle: (isOnline: boolean) => void;
  disabled?: boolean;
}

export const OnlineToggle: React.FC<OnlineToggleProps> = ({
  isOnline,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col items-center">
      <span className="text-sm text-gray-500 font-medium mb-3 uppercase tracking-wider">
        Shift Status
      </span>
      <button
        onClick={() => !disabled && onToggle(!isOnline)}
        disabled={disabled}
        className={`relative w-64 h-16 rounded-full transition-all duration-300 focus:outline-none flex items-center justify-between px-6 select-none ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : isOnline
            ? 'bg-emerald-500 text-white shadow-emerald-250 shadow-lg scale-102'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-250'
        }`}
      >
        {/* Toggle sliding ball */}
        <div
          className={`absolute top-1 left-1 w-14 h-14 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
            isOnline ? 'translate-x-48' : 'translate-x-0'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full ${
              disabled ? 'bg-gray-300' : isOnline ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Text descriptions */}
        <span
          className={`text-lg font-bold tracking-wide transition-all duration-300 w-full text-center ${
            isOnline ? 'pr-14 text-white' : 'pl-14 text-gray-655'
          }`}
        >
          {disabled ? 'UNDER REVIEW' : isOnline ? 'YOU ARE ONLINE' : 'GO ONLINE'}
        </span>
      </button>
      
      {!disabled && (
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isOnline ? 'Actively seeking delivery assignments' : 'Offline. Go online to receive orders.'}
        </p>
      )}
    </div>
  );
};

export default OnlineToggle;
