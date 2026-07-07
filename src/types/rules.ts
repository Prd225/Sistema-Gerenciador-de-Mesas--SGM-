export type RuleWidgetSize = '1x1' | '1x2' | '2x1' | '2x2';

export interface RuleWidget {
  id: string;
  size: RuleWidgetSize;
  title: string;
  content: string; // Deprecated or for single col
  contents?: string[];
  contentType?: 'text' | 'image';
  columnCount?: 1 | 2 | 3;
  imageUrl?: string;
}

export interface RulePage {
  id: string;
  name: string;
  widgets: RuleWidget[];
}
