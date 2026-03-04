import { Button } from "@/components/ui/button";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right peach-pink radial glow */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.12 30), transparent 70%)",
          }}
        />
        {/* Bottom-left subtle glow */}
        <div
          className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.10 30), transparent 70%)",
          }}
        />
        {/* Center crosshatch pattern — subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              oklch(0.62 0.13 30) 0px,
              oklch(0.62 0.13 30) 1px,
              transparent 1px,
              transparent 40px
            ),
            repeating-linear-gradient(
              90deg,
              oklch(0.62 0.13 30) 0px,
              oklch(0.62 0.13 30) 1px,
              transparent 1px,
              transparent 40px
            )`,
          }}
        />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        {/* Peach top border glow */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div
          className="bg-card border border-border/60 rounded-xl p-10 space-y-8"
          style={{
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.08), 0 0 60px oklch(0.62 0.13 30 / 0.10)",
          }}
        >
          {/* Logo mark */}
          <div className="text-center space-y-4">
            <div
              className="mx-auto h-20 w-20 rounded-full flex items-center justify-center relative"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, oklch(0.75 0.14 30), oklch(0.55 0.15 25))",
                boxShadow:
                  "0 0 32px oklch(0.62 0.13 30 / 0.35), inset 0 1px 0 oklch(0.88 0.08 30 / 0.4)",
              }}
            >
              <span className="text-white font-serif font-bold text-4xl leading-none">
                A
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="font-serif text-4xl font-bold text-foreground tracking-wide">
                AuditFlow
              </h1>
              <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-primary/70">
                Professional Audit Management
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground tracking-widest uppercase">
                Secure Access
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-muted-foreground text-sm leading-relaxed">
            Professional audit management for accounting firms.
            <br />
            Sign in to access your engagements and workpapers.
          </p>

          {/* Login button */}
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-13 text-base font-semibold tracking-wide shadow-accent-md hover:shadow-accent-glow transition-all duration-300"
            style={{ height: "52px" }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary/60" />
            <span>Secured by Internet Computer Protocol</span>
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
    </div>
  );
}
