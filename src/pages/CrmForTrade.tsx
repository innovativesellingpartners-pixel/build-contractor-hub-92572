import { useLocation, Navigate } from "react-router-dom";
import trades from "@/data/tradeCrmPages";
import { TradeCrmLandingPage } from "@/components/TradeCrmLandingPage";

export default function CrmForTrade() {
  const location = useLocation();
  const slug = location.pathname.replace("/crm-for-", "");
  const config = trades.find((t) => t.slug === slug);

  if (!config) return <Navigate to="/contractor-crm-software" replace />;

  return <TradeCrmLandingPage config={config} />;
}
