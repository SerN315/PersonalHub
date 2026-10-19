import type { Tint } from "@/app/utils/preferences";

// Props every widget receives. Callbacks take the widget id so one stable function serves every widget
// (that is what lets React skip re-rendering the other widgets while one is dragged or edited).
export default interface WidgetProps {
  id: string;
  minimized?: boolean;
  tint?: Tint;
  data?: Record<string, unknown>;
  onClose?: (id: string) => void;
  onTint?: (id: string, tint: Tint) => void;
  onData?: (id: string, patch: Record<string, unknown>) => void;
}
