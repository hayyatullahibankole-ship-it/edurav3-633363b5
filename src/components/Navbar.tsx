import { Button } from "@/components/ui/button";
import { Download, LayoutDashboard, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import eduraLogo from "@/assets/edura-logo.png";
import NotificationBell from "@/components/NotificationBell";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

/**
 * Top bar. Below the `lg` breakpoint this is a brand + call-to-action strip
 * only: the actual navigation lives in the bottom dock (see MobileTabBar).
 */
const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const { isInstalledApp } = useInstalledApp();
  const isMobile = useIsMobile();
  const isMobileWeb = isMobile && !isInstalledApp;
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);

  useEffect(() => {
    const checkSchoolAdmin = async () => {
      if (!user) {
        setIsSchoolAdmin(false);
        return;
      }
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!userData) return;
      const { data: school } = await supabase
        .from("schools")
        .select("id")
        .eq("admin_user_id", userData.id)
        .maybeSingle();
      setIsSchoolAdmin(!!school);
    };
    checkSchoolAdmin();
  }, [user]);

  return (
    <nav className="bg-background/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={eduraLogo} alt="Edura" className="h-16 md:h-20 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium">
            <Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Practice
            </Link>
            <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">
              Services
            </Link>
            {user && (
              <>
                <Link to="/study-hub" className="text-muted-foreground hover:text-foreground transition-colors">
                  Classroom
                </Link>
                <Link to="/forum" className="text-muted-foreground hover:text-foreground transition-colors">
                  Forum
                </Link>
              </>
            )}
            <Link to="/school-landing" className="text-muted-foreground hover:text-foreground transition-colors">
              For Schools
            </Link>
            <Link to="/payment" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          {/* Auth / account actions — visible at every width */}
          {user ? (
            <div className="flex items-center space-x-2">
              <NotificationBell />
              {isSchoolAdmin && (
                <Link to="/school-dashboard" className="hidden lg:block">
                  <Button variant="outline">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    School Dashboard
                  </Button>
                </Link>
              )}
              <Link to={isMobileWeb ? "/install-app" : "/dashboard"}>
                <Button variant="ghost" className={isMobileWeb ? "px-3" : ""}>
                  {isMobileWeb ? (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </>
                  ) : (
                    "Dashboard"
                  )}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to={isMobileWeb ? "/install-app" : "/auth"}>
                <Button className={isMobileWeb ? "px-3" : ""}>
                  {isMobileWeb ? (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
