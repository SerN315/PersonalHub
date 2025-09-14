import dynamic from "next/dynamic";
import "../styles/pages/dashboard.scss";
// Lazy load the client-only component
const WidgetClient = dynamic(() => import("./dasboardComponents/widgetClient"), {

});

export default async function DashboardPage() {

  return (
    <div className="p-6">
      <WidgetClient />
    </div>
  );
}
