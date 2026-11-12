import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  FolderOpen,
  MessageSquare,
  Sword,
  Calendar,
  BookOpen,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Headphones,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import eduraLogo from "@/assets/edura-logo.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Classroom", path: "/study-hub", icon: BookOpen },
  { title: "Challenge Arena", path: "/challenge-arena", icon: Sword },
  { title: "Study Planner", path: "/study-planner", icon: Calendar },
  { title: "Resources", path: "/resources", icon: FolderOpen },
  { title: "Forum", path: "/forum", icon: MessageSquare },
  { title: "Analytics", path: "/performance-report", icon: BarChart3 },
  
  { title: "Referral Program", path: "/referral-program", icon: Users },
  { title: "Profile", path: "/dashboard?tab=profile", icon: User },
  { title: "Settings", path: "/dashboard?tab=profile", icon: Settings },
];

interface DashboardSidebarProps {
  onLogout: () => void;
  schoolInfo?: {
    name: string;
    logo_url: string;
    school_code: string;
  } | null;
}

export function DashboardSidebar({ onLogout, schoolInfo }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path.includes("?tab=")) {
      const [basePath, query] = path.split("?");
      return location.pathname === basePath && location.search.includes(query.split("=")[1]);
    }
    return location.pathname === path;
  };

  return (
    <Sidebar className="border-r bg-sidebar" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo and Toggle */}
        <div className="p-6 flex items-center justify-between border-b border-sidebar-border bg-white">
          {schoolInfo?.logo_url ? (
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12 border-2">
                <AvatarImage 
                  src={`${schoolInfo.logo_url}?t=${Date.now()}`} 
                  alt={schoolInfo.name}
                />
                <AvatarFallback>
                  <img src={eduraLogo} alt="Edura" className="h-8 w-auto" />
                </AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{schoolInfo.name}</p>
                  <p className="text-xs text-muted-foreground">{schoolInfo.school_code}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {state !== "collapsed" ? (
                <img src={eduraLogo} alt="Edura" className="h-24 w-auto mx-auto" />
              ) : (
                <img src={eduraLogo} alt="Edura" className="h-10 w-auto mx-auto" />
              )}
            </>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3 py-4">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive: navActive }) => {
                        const active = isActive(item.path);
                        return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`;
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLogout();
            }}
            variant="destructive"
            className="w-full gap-2"
            size={state === "collapsed" ? "icon" : "default"}
          >
            <LogOut className="h-5 w-5" />
            {state !== "collapsed" && <span>Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
