import { useParams, Navigate } from "react-router-dom";
import trades from "@/data/tradeCrmPages";
import { TradeCrmLandingPage } from "@/components/TradeCrmLandingPage";

export default function CrmForTrade() {
  const { tradeSlug } = useParams<{ tradeSlug: string }>();
  const config = trades.find((t) => t.slug === tradeSlug);

  if (!config) return <Navigate to="/contractor-crm-software" replace />;

  return <TradeCrmLandingPage config={config} />;
}
