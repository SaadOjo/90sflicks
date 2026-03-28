export interface YearOption {
  year: number;
  count: number;
}

export interface SelectOption {
  value: string;
  label: string;
  count: number;
}

export type SortOption = 'releaseDate' | 'title' | 'boxOffice' | 'budget';
