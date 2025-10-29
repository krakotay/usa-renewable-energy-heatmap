
import React from 'react';

interface ScaleToggleProps {
  colorScale: 'linear' | 'logarithmic';
  setColorScale: (scale: 'linear' | 'logarithmic') => void;
}

export const ScaleToggle: React.FC<ScaleToggleProps> = ({ colorScale, setColorScale }) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2";
  const activeClasses = "bg-cyan-600 text-white shadow";
  const inactiveClasses = "bg-white text-gray-700 hover:bg-gray-100";

  return (
    <div className="bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-lg border border-gray-200 flex space-x-1">
      <button
        onClick={() => setColorScale('linear')}
        className={`${baseClasses} ${colorScale === 'linear' ? activeClasses : inactiveClasses}`}
        aria-pressed={colorScale === 'linear'}
      >
        Linear
      </button>
      <button
        onClick={() => setColorScale('logarithmic')}
        className={`${baseClasses} ${colorScale === 'logarithmic' ? activeClasses : inactiveClasses}`}
        aria-pressed={colorScale === 'logarithmic'}
      >
        Log
      </button>
    </div>
  );
};
