import { useParams, Navigate } from "react-router-dom";
import trades from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";
import { TradeCrmLandingPage } from "@/components/TradeCrmLandingPage";
import { CityTradeLandingPage } from "@/components/CityTradeLandingPage";

type CrmForTradeProps = {
  /**
   * Legacy support for routes like /crm-for-plumbers (React Router params can't match partial segments).
   * When provided, this takes precedence over useParams().
   */
  tradeSlug?: string;
};

export default function CrmForTrade({ tradeSlug: tradeSlugProp }: CrmForTradeProps) {
  const params = useParams<{ tradeSlug: string }>();
  const tradeSlug = tradeSlugProp ?? params.tradeSlug;

  if (!tradeSlug) {
    return <Navigate to="/contractor-crm-software" replace />;
  }

  // Check if this is a city+trade page (contains "-in-")
  const inIndex = tradeSlug.indexOf("-in-");
  if (inIndex !== -1) {
    const tradePartSlug = tradeSlug.substring(0, inIndex);
    const citySlug = tradeSlug.substring(inIndex + 4);
    const trade = trades.find((t) => t.slug === tradePartSlug);
    const city = cities.find((c) => c.slug === citySlug);

    if (trade && city) {
      return <CityTradeLandingPage trade={trade} city={city} />;
    }
  }

  // Standard trade page
  const config = trades.find((t) => t.slug === tradeSlug);
  if (!config) return <Navigate to="/contractor-crm-software" replace />;

  return <TradeCrmLandingPage config={config} />;
}
