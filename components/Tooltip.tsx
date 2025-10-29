import React from 'react';
import type { TooltipData } from '../types';

interface TooltipProps {
  data: TooltipData;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  const { name, percentage, total, wind, solar, x, y, perCapitaKWh, perCapitaRenewableKWh, population } = data;

  return (
    <div
      className="absolute bg-white text-gray-800 rounded-lg p-4 shadow-xl transition-opacity duration-200 pointer-events-none z-50 text-sm border border-gray-300 w-96"
      style={{
        left: `${x + 15}px`,
        top: `${y + 15}px`,
        transform: 'translateY(-100%)',
      }}
    >
      <h3 className="font-bold text-lg text-cyan-700 mb-2">{name}</h3>
      <div className="space-y-1">
        <p className="flex justify-between">
          <span className="font-semibold text-gray-600">Renewable Share:</span>
          <span className="font-mono text-lg text-gray-900">{percentage.toFixed(2)}%</span>
        </p>
        <p className="flex justify-between">
          <span className="font-semibold text-gray-600">Renewable Gen./Capita:</span>
          <span className="font-mono text-lg text-gray-900">{formatNumber(Math.round(perCapitaRenewableKWh))} kWh</span>
        </p>
        <p className="flex justify-between">
          <span className="font-semibold text-gray-600">Total Gen./Capita:</span>
          <span className="font-mono text-lg text-gray-900">{formatNumber(Math.round(perCapitaKWh))} kWh</span>
        </p>
        <p className="flex justify-between">
          <span className="font-semibold text-gray-600">Population (2024):</span>
          <span className="font-mono text-lg text-gray-900">{formatNumber(population)}</span>
        </p>
        <hr className="border-gray-200 my-2" />
        <p className="flex justify-between">
          <span className="text-gray-500">Solar Generation:</span>
          <span className="font-mono text-gray-900">{formatNumber(solar)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-500">Wind Generation:</span>
          <span className="font-mono text-gray-900">{formatNumber(wind)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-500">Total Generation:</span>
          <span className="font-mono text-gray-900">{formatNumber(total)}</span>
        </p>
      </div>
       <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
        Unit: thousand MWh
        <br />
        Source: U.S. EIA
      </p>
    </div>
  );
};