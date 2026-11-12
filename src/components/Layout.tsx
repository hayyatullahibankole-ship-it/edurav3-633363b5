import { ReactNode, useEffect } from "react";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import { MobileTabBar, CANDIDATE_NAV, PUBLIC_NAV } from "@/components/edura/AppShell";
import { useNavigate, useLocation } from "react-router-dom";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { useNativeApp } from "@/hooks/useNativeApp";
import { useAuth } from "@/hooks/useAuth";
import { LogIn } from "lucide-react";
import { StatusBar, Style } from "@capacitor/status-bar";

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showWhatsAppButton?: boolean;
  showMobileNav?: boolean;
}

const Layout = ({
  children,
  showNavbar = true,
  showWhatsAppButton = true,
  showMobileNav = true,
}: LayoutProps) => {
  const { isInstalledApp } = useInstalledApp();
  const { isNative } = useNativeApp();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Configure status bar for native apps (edge-to-edge: only set icon style)
  useEffect(() => {
    if (isNative) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    }
  }, [isNative]);

  // Mobile navigation always lives at the bottom of the screen — for visitors
  // and for signed-in students alike. Wait for auth to settle so a returning
  // student never sees the signed-out tabs flash first.
  const isAuthRoute = location.pathname === "/auth";
  const showBottomNav = showMobileNav && !isAuthRoute && !loading;

  return (
    <div className="min-h-screen bg-background">
      {showNavbar && !(isInstalledApp || isNative) && <Navbar />}

      <main className={showNavbar ? "" : "min-h-screen"}>{children}</main>

      {showWhatsAppButton && !(isInstalledApp || isNative) && <WhatsAppButton />}

      {showBottomNav && (
        <>
          {user ? (
            <MobileTabBar items={CANDIDATE_NAV} />
          ) : (
            <MobileTabBar
              items={PUBLIC_NAV}
              center={{ icon: LogIn, label: "Get started", onClick: () => navigate("/auth") }}
            />
          )}
          {/* Keeps the last card clear of the bottom dock. */}
          <div className="h-24 lg:hidden" />
        </>
      )}
    </div>
  );
};

export default Layout;
