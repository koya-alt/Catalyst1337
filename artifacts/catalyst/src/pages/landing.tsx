import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, Shield, Settings, BarChart3, PartyPopper, Music, Gamepad2, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  
  const loginMutation = useLogin();

  const handleDevLogin = (e: React.FormEvent) => {
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
      onError: (err) => {
        toast({
          title: "Error",
          description: "Could not connect to server",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative selection:bg-primary/30">
      {/* Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Catalyst</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#commands" className="hover:text-foreground transition-colors">Commands</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDevModalOpen(true)}
              className="text-xs font-medium text-muted-foreground/30 hover:text-muted-foreground transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Dev Panel
            </button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              Add to Discord
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Discord Bot
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Supercharge Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Discord Server</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Advanced moderation, powerful utility, and engaging features all in one seamless package. Built for communities of all sizes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] text-lg transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]">
              Add to Discord
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 font-bold text-lg hover:bg-white/5 transition-all">
              See Features
            </Button>
          </div>

          <div className="mt-16 pt-8 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center animate-in fade-in duration-1000 delay-500">
            <div>
              <div className="text-3xl font-bold text-foreground">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Commands</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Online</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">Free</div>
              <div className="text-sm text-muted-foreground mt-1">Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 relative z-10 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">One bot to replace them all. Catalyst brings moderation, utility, and fun together in perfect harmony.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 - Spans 2 cols on md */}
            <Card className="md:col-span-2 bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Advanced Moderation</h3>
                  <p className="text-muted-foreground mb-6">Keep your community safe with automated filters, detailed audit logs, and powerful manual moderation tools.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Ban/Kick', 'Mute', 'Warn System', 'Audit Log', 'Auto-mod'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-black/40 text-xs font-medium text-muted-foreground border border-white/5">{tag}</span>
                  ))}
                </div>
              </div>
            </Card>

            <FeatureCard 
              icon={<Settings className="w-6 h-6 text-secondary" />}
              iconColor="bg-secondary/20"
              title="Server Management"
              desc="Easily configure your server settings, roles, and permissions."
              tags={['Roles', 'Channels', 'Permissions']}
              hoverColor="group-hover:opacity-100 transition-opacity bg-gradient-to-r from-secondary to-transparent"
              borderColor="hover:border-secondary/50"
            />
            
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-emerald-500" />}
              iconColor="bg-emerald-500/20"
              title="Server Stats"
              desc="Track your server's growth and activity over time."
              tags={['Member Count', 'Activity', 'Analytics']}
              hoverColor="group-hover:opacity-100 transition-opacity bg-gradient-to-r from-emerald-500 to-transparent"
              borderColor="hover:border-emerald-500/50"
            />

            <FeatureCard 
              icon={<PartyPopper className="w-6 h-6 text-pink-500" />}
              iconColor="bg-pink-500/20"
              title="Welcome System"
              desc="Give new members a warm welcome to your community."
              tags={['Welcome DM', 'Auto Role']}
              hoverColor="group-hover:opacity-100 transition-opacity bg-gradient-to-r from-pink-500 to-transparent"
              borderColor="hover:border-pink-500/50"
            />

            <FeatureCard 
              icon={<Music className="w-6 h-6 text-blue-400" />}
              iconColor="bg-blue-400/20"
              title="Music Player"
              desc="High quality music playback directly in your voice channels."
              tags={['YouTube', 'Spotify', 'Queue']}
              hoverColor="group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-400 to-transparent"
              borderColor="hover:border-blue-400/50"
            />
            
            <FeatureCard 
              icon={<Gamepad2 className="w-6 h-6 text-orange-500" />}
              iconColor="bg-orange-500/20"
              title="Fun & Games"
              desc="Engage your members with economy and minigames."
              tags={['Minigames', 'Giveaways', 'Economy']}
              hoverColor="group-hover:opacity-100 transition-opacity bg-gradient-to-r from-orange-500 to-transparent"
              borderColor="hover:border-orange-500/50"
            />
          </div>
        </div>
      </section>

      {/* Commands / Chat Preview */}
      <section id="commands" className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Powerful Commands</h2>
              <p className="text-muted-foreground mb-8 text-lg">Everything is accessible through seamless slash commands. Just type <code className="bg-white/10 px-1 py-0.5 rounded text-primary">/</code> to get started.</p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "No complex prefixes to remember",
                  "Built-in autocomplete and parameter validation",
                  "Detailed help for every command"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="grid grid-cols-2 gap-3">
                {['/ban', '/kick', '/mute', '/warn', '/purge', '/role add', '/play', '/queue', '/giveaway', '/poll'].map(cmd => (
                  <div key={cmd} className="bg-card/30 border border-border/40 rounded-md px-3 py-2 font-mono text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold">{cmd.substring(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Mockup */}
            <div className="bg-[#313338] rounded-xl overflow-hidden shadow-2xl border border-[#1e1f22]">
              <div className="bg-[#2b2d31] p-4 border-b border-[#1e1f22] flex items-center gap-3">
                <span className="text-[#80848e] font-bold text-xl">#</span>
                <span className="font-bold text-white">general</span>
              </div>
              <div className="p-4 space-y-6">
                {/* User Message */}
                <div className="flex gap-4">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" className="w-10 h-10 rounded-full bg-[#1e1f22]" />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-[#f2f3f5]">Alex</span>
                      <span className="text-xs text-[#949ba4]">Today at 2:30 PM</span>
                    </div>
                    <div className="text-[#dbdee1] mt-1 font-mono text-sm bg-[#2b2d31] inline-block px-1.5 py-0.5 rounded">
                      <span className="text-[#00a8fc]">/userinfo</span> user: @Sarah
                    </div>
                  </div>
                </div>

                {/* Bot Message */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-[#f2f3f5]">Catalyst</span>
                      <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1 rounded uppercase tracking-wide">Bot</span>
                      <span className="text-xs text-[#949ba4]">Today at 2:30 PM</span>
                    </div>
                    <div className="mt-2 bg-[#2b2d31] rounded flex overflow-hidden border-l-4 border-primary">
                      <div className="p-4 w-full">
                        <div className="flex items-center gap-3 mb-4">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-12 h-12 rounded-full bg-[#1e1f22]" />
                          <div>
                            <div className="font-bold text-white text-lg">Sarah's Profile</div>
                            <div className="text-[#dbdee1] text-sm">User ID: 123456789012345678</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-bold text-[#b5bac1] uppercase mb-1">Joined Server</div>
                            <div className="text-sm text-[#dbdee1]">Jan 15, 2023</div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#b5bac1] uppercase mb-1">Roles</div>
                            <div className="flex gap-1">
                              <span className="w-3 h-3 rounded-full bg-purple-500 mt-1"></span>
                              <span className="text-sm text-[#dbdee1]">Admin</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#313338]">
                <div className="bg-[#383a40] rounded-lg p-3 text-[#949ba4] text-sm">
                  Message #general
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden bg-card border border-border p-12 text-center isolate">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 blur-[100px] z-0 rounded-full" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to upgrade your server?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of other servers using Catalyst to manage and engage their communities.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] text-lg transition-all">
                  Add to Discord
                </Button>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-8 font-bold text-lg">
                  View Commands
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-black/40 text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-foreground">Catalyst</span>
          </div>
          
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Catalyst Bot. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
            <a href="#" className="hover:text-foreground transition-colors">Invite</a>
          </div>
        </div>
      </footer>

      {/* Developer Password Modal */}
      <Dialog open={devModalOpen} onOpenChange={setDevModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Developer Panel</DialogTitle>
            <DialogDescription>
              Enter the developer password to access the bot control panel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDevLogin}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="bg-background/50 border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDevModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Authenticating..." : "Login"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureCard({ icon, title, desc, tags, hoverColor, borderColor, iconColor }: {
  icon: React.ReactNode, title: string, desc: string, tags: string[], hoverColor: string, borderColor: string, iconColor: string
}) {
  return (
    <Card className={`bg-card/40 backdrop-blur-sm border-border/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group ${borderColor}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 opacity-0 ${hoverColor}`} />
      <div className="p-6 h-full flex flex-col justify-between">
        <div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${iconColor}`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 text-sm">{desc}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map(tag => (
            <span key={tag} className="px-2 py-1 rounded-full bg-black/40 text-[10px] font-medium text-muted-foreground border border-white/5">{tag}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}
