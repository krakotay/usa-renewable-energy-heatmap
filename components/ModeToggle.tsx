
import React from 'react';

interface ModeToggleProps {
  mapMode: 'percentage' | 'absolute';
  setMapMode: (mode: 'percentage' | 'absolute') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mapMode, setMapMode }) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2";
  const activeClasses = "bg-cyan-600 text-white shadow";
  const inactiveClasses = "bg-white text-gray-700 hover:bg-gray-100";

  return (
    <div className="bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-gray-200 flex space-x-1">
      <button
        onClick={() => setMapMode('percentage')}
        className={`${baseClasses} ${mapMode === 'percentage' ? activeClasses : inactiveClasses}`}
        aria-pressed={mapMode === 'percentage'}
      >
        Percentage
      </button>
      <button
        onClick={() => setMapMode('absolute')}
        className={`${baseClasses} ${mapMode === 'absolute' ? activeClasses : inactiveClasses}`}
        aria-pressed={mapMode === 'absolute'}
      >
        Absolute (GWh)
      </button>
    </div>
  );
};
