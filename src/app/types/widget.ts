// types/Widget.ts
export default interface WidgetProps {
  id: string;
  minimized?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
}
