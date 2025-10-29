

import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { StateData } from '../types';
import { STATE_PATHS, STATE_LABEL_COORDS, STATE_LINES } from './usaMapData';

const getColorForPercentage = (percentage: number, min: number, max: number): string => {
  if (percentage <= 0) return '#4A5568'; // gray-700
  // Map percentage to a hue from 0 (red) to 120 (green)
  const ratio = (percentage - min) / (max - min);
  const hue = Math.max(0, Math.min(120, ratio * 120));
  return `hsl(${hue}, 80%, 50%)`;
};

interface USAMapProps {
  data: StateData[];
  minPercentage: number;
  maxPercentage: number;
  onStateHover: (data: StateData | null, position: { x: number; y: number } | null) => void;
  perCapitaFilter: number;
}

const StatePath: React.FC<{
  stateData: StateData;
  path: string;
  fill: string;
  isFiltered: boolean;
}> = ({ stateData, path, fill, isFiltered }) => (
  <path
    id={stateData.id}
    d={path}
    fill={isFiltered ? '#E5E7EB' : fill}
    stroke="#374151"
    strokeWidth="0.5"
    className="transition-all duration-150 ease-in-out hover:opacity-80"
    aria-label={stateData.name}
  />
);

const StateLabel: React.FC<{ stateId: string, percentage: number, isFiltered: boolean }> = ({ stateId, percentage, isFiltered }) => {
    const coords = STATE_LABEL_COORDS[stateId];
    if (!coords) return null;

    const isSmall = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC'].includes(stateId);
    const idFontSize = isSmall ? '8px' : '10px';
    const percentFontSize = isSmall ? '9px' : '11px';
    
    return (
        <g className="pointer-events-none">
            <text
                x={coords[0]}
                y={coords[1]}
                textAnchor="middle"
                alignmentBaseline="middle"
                className={`font-sans font-bold transition-colors ${isFiltered ? 'fill-gray-500' : 'fill-black'}`}
            >
                <tspan x={coords[0]} dy="-0.5em" style={{ fontSize: idFontSize }}>
                    {stateId}
                </tspan>
                 {percentage > 0 && !isFiltered && (
                    <tspan x={coords[0]} dy="1.2em" style={{ fontSize: percentFontSize }}>
                        {`${percentage.toFixed(0)}%`}
                    </tspan>
                )}
            </text>
        </g>
    );
};

export const USAMap: React.FC<USAMapProps> = ({ data, minPercentage, maxPercentage, onStateHover, perCapitaFilter }) => {
  const dataMap = useMemo(() => new Map(data.map(d => [d.id, d])), [data]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const viewBox = { width: 959, height: 593 };

  const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      if (!svgRef.current) return;
      
      const scaleAmount = e.deltaY > 0 ? 1 / 1.2 : 1.2;
      
      const svgRect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      const svgX = (mouseX / svgRect.width) * viewBox.width;
      const svgY = (mouseY / svgRect.height) * viewBox.height;

      setTransform(t => {
          const newScale = Math.max(1, Math.min(t.scale * scaleAmount, 10));
          if (newScale === t.scale) return t;
          
          const newX = svgX - (svgX - t.x) * (newScale / t.scale);
          const newY = svgY - (mouseY - t.y) * (newScale / t.scale);
          
          const boundedX = Math.min(0, Math.max(viewBox.width * (1 - newScale), newX));
          const boundedY = Math.min(0, Math.max(viewBox.height * (1 - newScale), newY));

          return { scale: newScale, x: boundedX, y: boundedY };
      });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setStartPoint({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      setIsPanning(true);
      if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
  }, [transform]);

  const handleMouseUp = useCallback(() => {
      setIsPanning(false);
      if (svgRef.current) svgRef.current.style.cursor = 'grab';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (isPanning) {
          e.preventDefault();
          onStateHover(null, null); // Hide tooltip while panning
          const x = e.clientX - startPoint.x;
          const y = e.clientY - startPoint.y;
          const boundedX = Math.min(0, Math.max(viewBox.width * (1 - transform.scale), x));
          const boundedY = Math.min(0, Math.max(viewBox.height * (1 - transform.scale), y));
          setTransform(t => ({ ...t, x: boundedX, y: boundedY }));
          return;
      }

      const target = e.target as SVGElement;
      if (target.tagName === 'path') {
        const stateData = dataMap.get(target.id);
        if (stateData) {
          onStateHover(stateData, { x: e.clientX, y: e.clientY });
        } else {
            onStateHover(null, null);
        }
      } else {
        onStateHover(null, null);
      }
  }, [isPanning, startPoint, transform.scale, dataMap, onStateHover]);

  const handleMouseLeave = useCallback(() => {
      onStateHover(null, null);
      setIsPanning(false);
      if (svgRef.current) svgRef.current.style.cursor = 'grab';
  }, [onStateHover]);
  
  return (
    <svg 
        ref={svgRef}
        viewBox="0 0 959 593"
        className="w-full h-auto max-h-[calc(100vh-120px)]"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'grab', touchAction: 'none' }}
        role="img"
        aria-label="Map of the United States showing renewable energy generation percentage by state"
    >
        <rect width="959" height="593" fill="white" />
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            <g className="states">
                {STATE_PATHS.map(({ id, d }) => {
                    const state = dataMap.get(id);
                    const stateData = state || { id, name: id, percentage: 0, total: 0, solar: 0, wind: 0, population: 0, perCapitaKWh: 0, perCapitaRenewableKWh: 0 };
                    
                    const isFiltered = id === 'DC' || (state ? state.perCapitaKWh < perCapitaFilter : false);

                    const fill = state 
                        ? getColorForPercentage(state.percentage, minPercentage, maxPercentage)
                        : '#4A5568';
                    
                    return (
                        <StatePath 
                            key={id}
                            stateData={stateData}
                            path={d}
                            fill={fill}
                            isFiltered={isFiltered}
                        />
                    );
                })}
            </g>
            <g className="state-lines" stroke="#4A5568" strokeWidth="0.5" fill="none">
                 {STATE_LINES.map((d, i) => (
                    <path key={`line-${i}`} d={d} />
                 ))}
            </g>
            <g className="state-labels">
                {STATE_PATHS.map(({ id }) => {
                    if (id === 'DC') return null;
                    const state = dataMap.get(id);
                    if (!state) return null;
                    const isFiltered = state.perCapitaKWh < perCapitaFilter;
                    return <StateLabel key={`label-${id}`} stateId={id} percentage={state.percentage} isFiltered={isFiltered} />;
                })}
            </g>
        </g>
    </svg>
  );
};