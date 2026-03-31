import { Link } from 'react-router-dom';

export const LegalLinks = () => (
  <div className="px-4 py-3 border-t text-xs text-muted-foreground flex items-center gap-2">
    <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
    <span>·</span>
    <Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
  </div>
);
