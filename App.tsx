
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { USAMap } from './components/USAMap';
import { Tooltip } from './components/Tooltip';
import { FilterControl } from './components/FilterControl';
import { parseEnergyData, parsePopulationData } from './services/dataParser';
import type { StateData, TooltipData } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<StateData[]>([]);
  const [minMax, setMinMax] = useState<{ min: number; max: number }>({ min: 0, max: 1 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [perCapitaFilter, setPerCapitaFilter] = useState<number>(0);
  const [usAveragePerCapita, setUsAveragePerCapita] = useState<number>(0);
  const [maxPerCapita, setMaxPerCapita] = useState<number>(0);

  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [rawEnergyData, setRawEnergyData] = useState<string | null>(null);
  const [populationMap, setPopulationMap] = useState<Map<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // alert(import.meta.env.BASE_URL);
        const [energyResponse, populationResponse] = await Promise.all([
          fetch(import.meta.env.BASE_URL + '/Net_generation_for_all_sectors.csv'),
          fetch( import.meta.env.BASE_URL + '/us-states---ranking-by-population-2025.csv')
        ]);
        
        if (!energyResponse.ok || !populationResponse.ok) {
            console.error("Failed to fetch data files.");
            setIsLoading(false);
            return;
        }

        const rawEnergyText = await energyResponse.text();
        const rawPopulationText = await populationResponse.text();

        setRawEnergyData(rawEnergyText);
        setPopulationMap(parsePopulationData(rawPopulationText));
        
      } catch (error) {
          console.error("Error fetching data:", error);
          setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!rawEnergyData || !populationMap) {
      return;
    }

    setIsLoading(true);
    try {
        const processedData = parseEnergyData(rawEnergyData, populationMap, selectedYear);
        setData(processedData);
        
        if (processedData.length > 0) {
            const percentages = processedData.map(d => d.percentage).filter(p => p > 0 && isFinite(p));
            if (percentages.length > 0) {
              const min = Math.min(...percentages);
              const reasonablePercentages = percentages.filter(p => p <= 100);
              const max = reasonablePercentages.length > 0 ? Math.max(...reasonablePercentages) : (percentages.length > 0 ? Math.max(...percentages) : 1);
              setMinMax({ min, max });
            } else {
                setMinMax({min: 0, max: 1});
            }

            let totalGeneration = 0;
            let totalPopulation = 0;
            const perCapitaValues = processedData.map(d => {
                totalGeneration += d.total; // in thousand MWh
                totalPopulation += d.population;
                return d.perCapitaKWh;
            }).filter(v => isFinite(v) && v > 0);

            if (totalPopulation > 0 && perCapitaValues.length > 0) {
                const average = (totalGeneration * 1000000) / totalPopulation;
                setUsAveragePerCapita(average);
                setMaxPerCapita(Math.ceil(Math.max(...perCapitaValues) / 1000) * 1000);
            } else {
                setUsAveragePerCapita(0);
                setMaxPerCapita(10000); // A default max
            }
        } else {
          setMinMax({min: 0, max: 1});
          setUsAveragePerCapita(0);
          setMaxPerCapita(10000);
        }
    } catch (error) {
        console.error(`Error processing data for year ${selectedYear}:`, error);
        setData([]);
    } finally {
        setIsLoading(false);
    }
  }, [rawEnergyData, populationMap, selectedYear]);
  
  const handleStateHover = useCallback((stateData: StateData | null, position: { x: number; y: number } | null) => {
    if (stateData && position) {
      setTooltip({
        ...stateData,
        x: position.x,
        y: position.y,
      });
    } else {
      setTooltip(null);
    }
  }, []);

  const Legend: React.FC<{ min: number; max: number }> = useMemo(() => {
    return ({ min, max }) => {
      const gradientStops = 5;
      const stops = Array.from({ length: gradientStops }, (_, i) => {
        const value = min + (i / (gradientStops - 1)) * (max - min);
        const ratio = (max - min) > 0 ? (value - min) / (max - min) : 0;
        const hue = Math.max(0, Math.min(120, ratio * 120));
        return {
          value,
          color: `hsl(${hue}, 80%, 50%)`,
        };
      });

      return (
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-gray-800 text-sm w-full max-w-xs md:max-w-sm">
          <p className="font-bold mb-2">Solar + Wind Generation %</p>
          <div className="flex items-center space-x-2">
            <span className="w-10 text-right text-gray-600">{min.toFixed(1)}%</span>
            <div className="flex-1 h-4 rounded-full" style={{ background: `linear-gradient(to right, ${stops.map(s => s.color).join(', ')})` }}></div>
            <span className="w-10 text-left text-gray-600">{max.toFixed(1)}%</span>
          </div>
        </div>
      );
    };
  }, []);

  const years = Array.from({ length: 2024 - 2001 + 1 }, (_, i) => 2024 - i);

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center p-4 overflow-hidden relative">
      <header className="text-center mb-4 z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">USA Renewable Energy Heatmap {selectedYear}</h1>
        <p className="text-gray-600 mt-1">Share of Electricity from Solar & Wind (Population data from 2024)</p>
      </header>
       <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200 z-20">
        <label htmlFor="year-select" className="text-sm font-bold text-gray-700 mr-2">Year:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm"
          aria-label="Select year"
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <main className="relative w-full flex-grow flex items-center justify-center">
        {isLoading ? (
          <p>Loading map data...</p>
        ) : data.length > 0 ? (
          <USAMap 
            data={data} 
            minPercentage={minMax.min} 
            maxPercentage={minMax.max}
            onStateHover={handleStateHover}
            perCapitaFilter={perCapitaFilter}
          />
        ) : (
          <p>No data available for {selectedYear}.</p>
        )}
      </main>
      {!isLoading && data.length > 0 && (
        <FilterControl
            perCapitaFilter={perCapitaFilter}
            setPerCapitaFilter={setPerCapitaFilter}
            maxPerCapita={maxPerCapita}
            usAveragePerCapita={usAveragePerCapita}
        />
      )}
      {!isLoading && data.length > 0 && <Legend min={minMax.min} max={minMax.max} />}
      {tooltip && <Tooltip data={tooltip} />}
    </div>
  );
};

export default App;
