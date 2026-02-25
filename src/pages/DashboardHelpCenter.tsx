import HelpCenter from "@/components/help/HelpCenter";
import { useNavigate } from "react-router-dom";

export default function DashboardHelpCenter() {
  const navigate = useNavigate();

  return (
    <HelpCenter
      onBack={() => navigate("/dashboard")}
      onNavigateToSection={(section) => {
        sessionStorage.setItem('dashboardActiveSection', section);
        navigate("/dashboard");
      }}
      showChatbot={false}
    />
  );
}
