import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export function ProfileEditDialog() {
  const navigate = useNavigate();

  return (
    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/profile')}>
      <Pencil className="h-4 w-4 mr-2" />
      Edit Profile
    </Button>
  );
}

