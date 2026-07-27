export interface LabelValueStat {
  label: string;
  value: number;
}

export interface WeightedLabelValueStat {
  label: string;
  value: number;
  weight: number;
}

export interface YearlyGroupStat {
  year: string;
  [type: string]: number | string;
}

export interface SummaryStat {
  stats: LabelValueStat[];
  grouped: Record<string, LabelValueStat[]>;
}

export interface SummaryStats {
  stats: WeightedLabelValueStat[];
}
