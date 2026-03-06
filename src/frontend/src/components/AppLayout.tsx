import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import {
  AlertCircle,
  Briefcase,
  Check,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const THEMES = [
  {
    id: "light",
    label: "Grey & Peach",
    description: "Light mode",
    swatch: "bg-[#f7f4f1]",
    accent: "bg-[#d4826a]",
  },
  {
    id: "dark",
    label: "Dark Mode",
    description: "Charcoal & Peach",
    swatch: "bg-[#1e1e1e]",
    accent: "bg-[#c47a5a]",
  },
  {
    id: "deep-navy",
    label: "Deep Navy & Gold",
    description: "Dark navy with gold",
    swatch: "bg-[#0D1B2A]",
    accent: "bg-[#C9A84C]",
  },
  {
    id: "navy-light",
    label: "Navy Corporate",
    description: "White with navy & emerald",
    swatch: "bg-[#FFFFFF] border border-gray-200",
    accent: "bg-[#0B3C5D]",
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link
        to="/"
        onClick={onClick}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium tracking-wide ${
          isActive("/") && location.pathname === "/"
            ? "bg-primary text-primary-foreground shadow-accent-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        data-ocid="nav.dashboard.link"
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        <span>Dashboard</span>
      </Link>
      <Link
        to="/engagements"
        onClick={onClick}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium tracking-wide ${
          isActive("/engagements")
            ? "bg-primary text-primary-foreground shadow-accent-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        data-ocid="nav.engagements.link"
      >
        <Briefcase className="h-4 w-4 shrink-0" />
        <span>Engagements</span>
      </Link>
      <Link
        to="/issues"
        onClick={onClick}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium tracking-wide ${
          isActive("/issues")
            ? "bg-primary text-primary-foreground shadow-accent-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        data-ocid="nav.issues.link"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Issues</span>
      </Link>
      <Link
        to="/follow-ups"
        onClick={onClick}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium tracking-wide ${
          isActive("/follow-ups")
            ? "bg-primary text-primary-foreground shadow-accent-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        data-ocid="nav.followups.link"
      >
        <Clock className="h-4 w-4 shrink-0" />
        <span>Follow-ups</span>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — sleek dark with gold accent line */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/90 backdrop-blur-md">
        {/* Gold accent line at top of header */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
        <div className="container mx-auto flex h-15 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center shadow-accent-sm group-hover:shadow-accent-md transition-shadow duration-300">
                <span className="text-primary-foreground font-bold font-serif text-xl leading-none">
                  A
                </span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-serif text-xl font-bold text-foreground leading-none tracking-wide">
                  AuditFlow
                </span>
                <span className="text-[10px] text-primary/70 font-medium tracking-[0.2em] uppercase leading-none mt-0.5">
                  Professional
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  data-ocid="settings.theme.toggle"
                  title="Change theme"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-3 w-3 rounded-full ${currentTheme.swatch}`}
                    />
                    <div
                      className={`h-3 w-3 rounded-full ${currentTheme.accent}`}
                    />
                  </div>
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Choose Theme
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEMES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <div className={`h-3 w-3 rounded-full ${t.swatch}`} />
                      <div className={`h-3 w-3 rounded-full ${t.accent}`} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    </div>
                    {theme === t.id && (
                      <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Mobile icon-only trigger */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  data-ocid="settings.theme.toggle"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Choose Theme
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEMES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      <div className={`h-3 w-3 rounded-full ${t.swatch}`} />
                      <div className={`h-3 w-3 rounded-full ${t.accent}`} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    </div>
                    {theme === t.id && (
                      <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-secondary"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-card border-border w-72">
                {/* Mobile sheet gold accent */}
                <div className="h-[2px] w-full bg-gradient-to-r from-primary/80 to-transparent -mt-6 mb-6" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center shadow-accent-sm">
                    <span className="text-primary-foreground font-bold font-serif text-xl leading-none">
                      A
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-xl font-bold text-foreground leading-none">
                      AuditFlow
                    </span>
                    <span className="text-[10px] text-primary/70 font-medium tracking-[0.2em] uppercase leading-none mt-0.5">
                      Professional
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} />
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground px-2 mb-1 font-medium uppercase tracking-wider">
                      Theme
                    </p>
                    {THEMES.map((t) => (
                      <Button
                        key={t.id}
                        variant="ghost"
                        onClick={() => {
                          setTheme(t.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full justify-start gap-3 ${theme === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"} hover:bg-secondary`}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`h-3 w-3 rounded-full ${t.swatch}`} />
                          <div className={`h-3 w-3 rounded-full ${t.accent}`} />
                        </div>
                        <span>{t.label}</span>
                        {theme === t.id && (
                          <Check className="h-3.5 w-3.5 ml-auto shrink-0" />
                        )}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary mt-2"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 mt-auto bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
