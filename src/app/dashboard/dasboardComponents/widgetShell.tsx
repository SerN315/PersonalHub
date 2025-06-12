type WidgetShellProps = {
  layout: any[];
};

export default function WidgetShell({ layout }: WidgetShellProps) {
  return (
    <div className="grid grid-cols-3 gap-4 opacity-30 pointer-events-none">
      {layout.map((item) => (
        <div key={item.i} className="border p-4 bg-gray-800 text-white rounded">
          {item.i.toUpperCase()}
        </div>
      ))}
    </div>
  );
}
