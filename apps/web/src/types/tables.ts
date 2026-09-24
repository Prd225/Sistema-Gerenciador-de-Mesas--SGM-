export interface TableData {
  id: string;
  title: string;
  color?: string;
  updatedAt: number;
  data: string[][];
}

export interface TablePage {
  id: string;
  name: string;
  tables: TableData[];
}
