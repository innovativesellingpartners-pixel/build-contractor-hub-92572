import { useParams, Navigate } from "react-router-dom";
import featurePages from "@/data/seoFeaturePages";
import { FeatureExplainerPage } from "@/components/FeatureExplainerPage";

export default function FeaturePage() {
  const { slug } = useParams<{ slug: string }>();
  const config = featurePages.find((f) => f.slug === slug);

  if (!config) return <Navigate to="/what-we-do" replace />;

  return <FeatureExplainerPage config={config} />;
}
