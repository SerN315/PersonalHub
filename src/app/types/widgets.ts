// Type definitions for better TypeScript support
export interface Widget {
  id: string;
  user_id: string;
  type: string;
  position:
    | {
        x: number;
        y: number;
        w: number;
        h: number;
      }
    | string; // Handle both object and stringified JSON
  data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetState {
  visible: boolean;
  minimized: boolean;
}
