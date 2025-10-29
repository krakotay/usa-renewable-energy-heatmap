
import React from 'react';

interface FilterControlProps {
  perCapitaFilter: number;
  setPerCapitaFilter: (value: number) => void;
  maxPerCapita: number;
  usAveragePerCapita: number;
}

export const FilterControl: React.FC<FilterControlProps> = ({
  perCapitaFilter,
  setPerCapitaFilter,
  maxPerCapita,
  usAveragePerCapita,
}) => {
  return (
    <div className="absolute bottom-24 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-gray-800 text-sm w-full max-w-xs md:max-w-sm z-10">
      <label htmlFor="perCapitaFilter" className="font-bold mb-2 block">
        Total Gen. per Capita (kWh)
      </label>
      <div className="flex items-center space-x-2">
        <input
          id="perCapitaFilter"
          type="range"
          min="0"
          max={maxPerCapita}
          step={100}
          value={perCapitaFilter}
          onChange={(e) => setPerCapitaFilter(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-label="Filter by per-capita total generation"
        />
        <span className="font-mono text-right w-24 bg-gray-100 px-2 py-1 rounded">
            {perCapitaFilter.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex justify-center">
        <button
          onClick={() => setPerCapitaFilter(Math.round(usAveragePerCapita))}
          className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold py-1 px-2 rounded-md bg-cyan-100/50 hover:bg-cyan-100 transition-colors"
          title={`Set filter to the US average per capita total generation: ${Math.round(usAveragePerCapita).toLocaleString()} kWh`}
        >
          US Average: {Math.round(usAveragePerCapita).toLocaleString()} kWh
        </button>
      </div>
    </div>
  );
};