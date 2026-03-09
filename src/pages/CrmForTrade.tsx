import { useLocation, Navigate } from "react-router-dom";
import trades from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";
import { TradeCrmLandingPage } from "@/components/TradeCrmLandingPage";
import { CityTradeLandingPage } from "@/components/CityTradeLandingPage";

export default function CrmForTrade() {
  const location = useLocation();
  const path = location.pathname.replace("/crm-for-", "");

  // Check if this is a city+trade page (contains "-in-")
  const inIndex = path.indexOf("-in-");
  if (inIndex !== -1) {
    const tradeSlug = path.substring(0, inIndex);
    const citySlug = path.substring(inIndex + 4);
    const trade = trades.find((t) => t.slug === tradeSlug);
    const city = cities.find((c) => c.slug === citySlug);

    if (trade && city) {
      return <CityTradeLandingPage trade={trade} city={city} />;
    }
  }

  // Standard trade page
  const config = trades.find((t) => t.slug === path);
  if (!config) return <Navigate to="/contractor-crm-software" replace />;

  return <TradeCrmLandingPage config={config} />;
}
