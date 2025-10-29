
export interface StateData {
  id: string; // e.g., 'CA'
  name: string; // e.g., 'California'
  total: number;
  wind: number;
  solar: number;
  percentage: number;
  population: number;
  perCapitaKWh: number;
  perCapitaRenewableKWh: number;
}

export interface TooltipData extends StateData {
  x: number;
  y: number;
}
