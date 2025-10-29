import type { StateData } from '../types';
import { STATE_NAME_TO_ID } from '../constants';

interface ParsedStateData {
  total?: number;
  wind?: number;
  solar?: number;
}

const parseValue = (value: string | undefined): number => {
  if (!value || value.trim() === '--' || value.trim() === '') {
    return 0;
  }
  return parseInt(value.trim(), 10);
};

export const parsePopulationData = (rawData: string): Map<string, number> => {
  const lines = rawData.trim().split(/\r?\n/);
  const populationMap = new Map<string, number>();
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',').map(c => c.replace(/"/g, ''));
    const stateCode = columns[1];
    if (stateCode === 'DC') {
        continue;
    }
    const population2024 = parseInt(columns[4], 10);
    if (stateCode && !isNaN(population2024)) {
      populationMap.set(stateCode, population2024);
    }
  }
  return populationMap;
};


export const parseEnergyData = (energyRawData: string, populationData: Map<string, number>, year: number): StateData[] => {
  const lines = energyRawData.trim().split(/\r?\n/);
  
  const headerRow = lines.find(line => line.startsWith('"description"'));
  if (!headerRow) {
    console.error("Could not find header row in energy data.");
    return [];
  }
  const headers = headerRow.split(',').map(h => h.replace(/"/g, ''));
  const yearIndex = headers.indexOf(String(year));
  if (yearIndex === -1) {
    console.error(`Data for year ${year} not found in energy data header.`);
    return [];
  }

  const dataMap: { [key:string]: ParsedStateData } = {};
  let currentState: string | null = null;

  for (const line of lines) {
    const columns = line.split(',').map(c => c.replace(/"/g, ''));
    const description = columns[0].trim();
    const sourceKey = columns[2] ? columns[2].trim() : '';

    // Identify a state line
    if (sourceKey.endsWith('..A') && STATE_NAME_TO_ID[description]) {
      currentState = description;
      if (!dataMap[currentState]) {
        dataMap[currentState] = {};
      }
      continue;
    }

    if (currentState && description.startsWith(currentState)) {
      const valueForYear = columns[yearIndex];
      if (description.includes(': all fuels (utility-scale)')) {
        dataMap[currentState].total = parseValue(valueForYear);
      } else if (description.includes(': wind')) {
        dataMap[currentState].wind = parseValue(valueForYear);
      } else if (description.includes(': all solar')) {
        dataMap[currentState].solar = parseValue(valueForYear);
      }
    }
  }

  const result: StateData[] = [];
  for (const stateName in dataMap) {
    if (stateName === 'District Of Columbia') {
        continue;
    }
    const id = STATE_NAME_TO_ID[stateName];
    if (id) {
      const stateData = dataMap[stateName];
      const total = stateData.total || 0;
      const wind = stateData.wind || 0;
      const solar = stateData.solar || 0;
      
      const population = populationData.get(id) || 0;
      const perCapitaKWh = population > 0 ? (total * 1000 * 1000) / population : 0;
      const perCapitaRenewableKWh = population > 0 ? ((wind + solar) * 1000000) / population : 0;

      // The "total" is utility-scale, but "all solar" includes small-scale (rooftop).
      // This can lead to a percentage >100% for places like DC, as distributed generation can exceed utility-scale generation.
      const percentage = total > 0 ? ((wind + solar) / total) * 100 : 0;
      
      result.push({
        id,
        name: stateName,
        total,
        wind,
        solar,
        percentage,
        population,
        perCapitaKWh,
        perCapitaRenewableKWh,
      });
    }
  }

  return result;
};