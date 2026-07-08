export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: number;
}

export interface NotePage {
  id: string;
  name: string;
  notes: Note[];
}
