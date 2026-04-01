import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useAuthCheck } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  
  const { data: authStatus, isLoading: isAuthChecking } = useAuthCheck();
  const loginMutation = useLogin();

  useEffect(() => {
    if (authStatus?.loggedIn) {
      setLocation("/dashboard");
    }
  }, [authStatus, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { password } }, {
      onSuccess: (data) => {
        if (data.success) {
          setLocation("/dashboard");
        } else {
          toast({
            title: "Access Denied",
            description: data.error || "Invalid password",
            variant: "destructive",
          });
        }
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not connect to server",
          variant: "destructive",
        });
      }
    });
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Login to the developer panel</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-md border-border/50 shadow-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Developer Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/50 border-border h-12"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Login to Panel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
