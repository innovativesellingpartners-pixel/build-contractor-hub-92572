import { useParams, Navigate } from "react-router-dom";
import trades from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";
import { CityTradeLandingPage } from "@/components/CityTradeLandingPage";

export default function CityTradePage() {
  const { tradeSlug, citySlug } = useParams<{ tradeSlug: string; citySlug: string }>();
  const trade = trades.find((t) => t.slug === tradeSlug);
  const city = cities.find((c) => c.slug === citySlug);

  if (!trade || !city) return <Navigate to="/trades-we-serve" replace />;

  return <CityTradeLandingPage trade={trade} city={city} />;
}
