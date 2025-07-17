export interface LabelValueStat {
  label: string;
  value: number;
}

export interface YearlyGroupStat {
  year: string;
  [type: string]: number | string;
}
