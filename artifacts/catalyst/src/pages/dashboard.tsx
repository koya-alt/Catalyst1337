import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Zap, LogOut, RefreshCw, Server, Send, ShieldAlert, Trash2, AlertTriangle,
  Users, UserX, UserMinus, UserCheck, Skull, MessageSquare, Search, Shield,
  ChevronRight, X, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAuthCheck,
  useGetBotStatus,
  useConnectBot,
  useDisconnectBot,
  useLogout,
  useGetBotGuilds,
  useGetBotChannels,
  useGetBotMembers,
  getGetBotChannelsQueryKey,
  getGetBotMembersQueryKey,
  useLeaveGuild,
  useDeleteChannels,
  useDeleteRoles,
  useKickAllMembers,
  useBanAllMembers,
  useUnbanAllMembers,
  useNukeGuild,
  useBanUser,
  useKickUser,
  useUnbanUser,
  useDmAllMembers,
  useSendMessage
} from "@workspace/api-client-react";

type LogEntry = { id: number; time: string; msg: string; type: "success" | "error" | "info" | "warn" };
type Tab = "nuke" | "members" | "messaging" | "mass";

export default function DashboardPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authStatus, isLoading: isAuthChecking } = useAuthCheck();
  useEffect(() => {
    if (!isAuthChecking && !authStatus?.loggedIn) setLocation("/login");
  }, [authStatus, isAuthChecking, setLocation]);

  const logoutMutation = useLogout();
  const handleLogout = () => logoutMutation.mutate(undefined, { onSuccess: () => setLocation("/") });

  const { data: botStatus, refetch: refetchStatus } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const isConnected = botStatus?.connected || false;
  const botUsername = botStatus?.username;

  const connectMutation = useConnectBot();
  const disconnectMutation = useDisconnectBot();
  const [token, setToken] = useState("");

  const { data: guildsData, refetch: refetchGuilds } = useGetBotGuilds({ query: { enabled: isConnected } });
  const guilds = guildsData?.guilds || [];
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const selectedGuildName = guilds.find(g => g.id === selectedGuild)?.name ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("nuke");

  const { data: channelsData } = useGetBotChannels(
    { guildId: selectedGuild || "" },
    { query: { enabled: !!selectedGuild && isConnected && activeTab === "messaging", queryKey: getGetBotChannelsQueryKey({ guildId: selectedGuild || "" }) } }
  );
  const channels = channelsData?.channels || [];

  const { data: membersData, refetch: refetchMembers, isFetching: isFetchingMembers } = useGetBotMembers(
    { guildId: selectedGuild || "" },
    { query: { enabled: !!selectedGuild && isConnected && activeTab === "members", queryKey: getGetBotMembersQueryKey({ guildId: selectedGuild || "" }) } }
  );
  const allMembers = membersData?.members || [];
  const [memberSearch, setMemberSearch] = useState("");
  const members = allMembers.filter(m =>
    m.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.displayName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const addLog = (msg: string, type: LogEntry["type"] = "info") =>
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 100));

  const leaveGuildMutation = useLeaveGuild();
  const deleteChannelsMutation = useDeleteChannels();
  const deleteRolesMutation = useDeleteRoles();
  const kickMembersMutation = useKickAllMembers();
  const banMembersMutation = useBanAllMembers();
  const unbanAllMutation = useUnbanAllMembers();
  const nukeMutation = useNukeGuild();
  const banUserMutation = useBanUser();
  const kickUserMutation = useKickUser();
  const unbanUserMutation = useUnbanUser();
  const dmAllMutation = useDmAllMembers();
  const sendMsgMutation = useSendMessage();

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; desc: string; action: () => void }>({
    isOpen: false, title: "", desc: "", action: () => {}
  });
  const confirm = (title: string, desc: string, action: () => void) =>
    setConfirmDialog({ isOpen: true, title, desc, action });
  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  // Nuke state
  const [nukeOpts, setNukeOpts] = useState({
    deleteChannels: true, deleteRoles: true, kickAll: false, banAll: true, leaveAfter: true
  });
  const toggleNuke = (key: keyof typeof nukeOpts) => setNukeOpts(prev => ({ ...prev, [key]: !prev[key] }));

  // Single user action state
  const [singleUserId, setSingleUserId] = useState("");
  const [singleReason, setSingleReason] = useState("");

  // Message state
  const [selectedChannel, setSelectedChannel] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [dmMessage, setDmMessage] = useState("");

  const handleConnect = () => {
    if (!token) return;
    connectMutation.mutate({ data: { token } }, {
      onSuccess: (res) => {
        if (res.success) {
          toast({ title: "Bot Connected", description: `Logged in as ${res.username}` });
          refetchStatus(); refetchGuilds();
        } else {
          toast({ title: "Connection Failed", description: res.error, variant: "destructive" });
        }
      }
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => { toast({ title: "Bot Disconnected" }); refetchStatus(); setSelectedGuild(null); }
    });
  };

  const handleNuke = () => {
    if (!selectedGuild) return;
    const selected = Object.entries(nukeOpts).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0) { toast({ title: "Select at least one nuke option", variant: "destructive" }); return; }
    confirm(
      "☢ NUKE SERVER",
      `This will execute: ${selected.join(", ")} on "${selectedGuildName}". This is IRREVERSIBLE.`,
      () => {
        nukeMutation.mutate({ data: { guildId: selectedGuild!, ...nukeOpts } }, {
          onSuccess: (res) => {
            if (res.success) {
              res.steps.forEach(s => addLog(`Nuke › ${s.step}: ${s.success ? `✓ (${s.count ?? ""})` : `✗ ${s.error}`}`, s.success ? "success" : "error"));
              addLog(`Nuke complete on ${selectedGuildName}`, "warn");
              if (nukeOpts.leaveAfter) { setSelectedGuild(null); refetchGuilds(); }
            } else {
              addLog(`Nuke failed: ${res.error}`, "error");
            }
          }
        });
      }
    );
  };

  const handleBanUser = () => {
    if (!selectedGuild || !singleUserId.trim()) return;
    banUserMutation.mutate({ data: { guildId: selectedGuild, userId: singleUserId.trim(), reason: singleReason || undefined } }, {
      onSuccess: (res) => {
        if (res.success) { addLog(`Banned user ${singleUserId}${singleReason ? ` — ${singleReason}` : ""}`, "success"); setSingleUserId(""); setSingleReason(""); }
        else addLog(`Ban failed: ${res.error}`, "error");
      }
    });
  };

  const handleKickUser = () => {
    if (!selectedGuild || !singleUserId.trim()) return;
    kickUserMutation.mutate({ data: { guildId: selectedGuild, userId: singleUserId.trim(), reason: singleReason || undefined } }, {
      onSuccess: (res) => {
        if (res.success) { addLog(`Kicked user ${singleUserId}${singleReason ? ` — ${singleReason}` : ""}`, "success"); setSingleUserId(""); setSingleReason(""); }
        else addLog(`Kick failed: ${res.error}`, "error");
      }
    });
  };

  const handleUnbanUser = () => {
    if (!selectedGuild || !singleUserId.trim()) return;
    unbanUserMutation.mutate({ data: { guildId: selectedGuild, userId: singleUserId.trim(), reason: singleReason || undefined } }, {
      onSuccess: (res) => {
        if (res.success) { addLog(`Unbanned user ${singleUserId}`, "success"); setSingleUserId(""); setSingleReason(""); }
        else addLog(`Unban failed: ${res.error}`, "error");
      }
    });
  };

  const handleMemberBan = (userId: string, username: string) => {
    if (!selectedGuild) return;
    confirm("Ban Member", `Ban ${username} from ${selectedGuildName}?`, () => {
      banUserMutation.mutate({ data: { guildId: selectedGuild!, userId, reason: "Banned by Catalyst" } }, {
        onSuccess: (res) => addLog(res.success ? `Banned ${username}` : `Ban failed: ${res.error}`, res.success ? "success" : "error")
      });
    });
  };

  const handleMemberKick = (userId: string, username: string) => {
    if (!selectedGuild) return;
    confirm("Kick Member", `Kick ${username} from ${selectedGuildName}?`, () => {
      kickUserMutation.mutate({ data: { guildId: selectedGuild!, userId, reason: "Kicked by Catalyst" } }, {
        onSuccess: (res) => addLog(res.success ? `Kicked ${username}` : `Kick failed: ${res.error}`, res.success ? "success" : "error")
      });
    });
  };

  const handleSendMessage = () => {
    if (!selectedGuild || !selectedChannel || !messageContent) return;
    sendMsgMutation.mutate({ data: { guildId: selectedGuild, channelId: selectedChannel, message: messageContent } }, {
      onSuccess: (res) => {
        if (res.success) { addLog(`Message sent to #${channels.find(c => c.id === selectedChannel)?.name}`, "success"); setMessageContent(""); }
        else addLog(`Send failed: ${res.error}`, "error");
      }
    });
  };

  const handleDmAll = () => {
    if (!selectedGuild || !dmMessage) return;
    confirm("DM All Members", `Send a DM to all members of "${selectedGuildName}"? Many DMs may fail if users have DMs disabled.`, () => {
      dmAllMutation.mutate({ data: { guildId: selectedGuild!, message: dmMessage } }, {
        onSuccess: (res) => {
          if (res.success) {
            const ok = (res.results ?? []).filter(r => r.success).length;
            const fail = (res.results ?? []).length - ok;
            addLog(`DM All: ${ok} sent, ${fail} failed`, ok > 0 ? "success" : "warn");
            setDmMessage("");
          } else {
            addLog(`DM All failed: ${res.error}`, "error");
          }
        }
      });
    });
  };

  const massAction = (label: string, mutation: any, key: string, warn = true) => {
    if (!selectedGuild) return;
    const run = () => mutation.mutate({ data: { guildId: selectedGuild } }, {
      onSuccess: (res: any) => {
        if (res.success) {
          const ok = (res.results ?? []).filter((r: any) => r.success).length;
          addLog(`${label}: ${ok} affected`, "success");
          if (label === "Leave Server") { setSelectedGuild(null); refetchGuilds(); }
        } else addLog(`${label} failed: ${res.error}`, "error");
      },
      onError: (err: any) => addLog(`${label} error: ${err.message}`, "error")
    });
    if (warn) confirm(label, `Run "${label}" on "${selectedGuildName}"? This may be irreversible.`, run);
    else run();
  };

  if (isAuthChecking || !authStatus?.loggedIn) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "nuke", label: "Nuke", icon: <Skull className="w-4 h-4" /> },
    { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
    { id: "messaging", label: "Messaging", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "mass", label: "Mass Actions", icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-border/50 bg-card/60 backdrop-blur flex items-center justify-between px-5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm hidden sm:block">Catalyst Panel</span>
          <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isConnected ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-muted/50 text-muted-foreground border border-border/50"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
            {isConnected ? (botUsername ?? "Online") : "Offline"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Homepage</Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-white h-8 text-xs">
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border/50 bg-card/20 flex flex-col overflow-hidden">
          {/* Token Connect */}
          <div className="p-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Bot Token</p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Token..."
                value={token}
                onChange={e => setToken(e.target.value)}
                disabled={isConnected}
                className="flex-1 font-mono text-xs bg-black/50 h-8 text-xs"
              />
              {!isConnected ? (
                <Button size="sm" onClick={handleConnect} disabled={connectMutation.isPending || !token} className="h-8 px-3 text-xs shrink-0">
                  {connectMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Connect"}
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={handleDisconnect} disabled={disconnectMutation.isPending} className="h-8 px-3 text-xs shrink-0">
                  {disconnectMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Off"}
                </Button>
              )}
            </div>
          </div>

          {/* Server List */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Servers ({guilds.length})</p>
            <Button variant="ghost" size="icon" onClick={() => refetchGuilds()} className="w-6 h-6">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!isConnected ? (
              <div className="p-4 text-center text-muted-foreground/50 text-xs mt-4">
                <Server className="w-6 h-6 mx-auto mb-2 opacity-20" />
                Connect the bot first
              </div>
            ) : guilds.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground/50 text-xs mt-4">
                <Server className="w-6 h-6 mx-auto mb-2 opacity-20" />
                No servers found
              </div>
            ) : (
              guilds.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGuild(g.id); setMemberSearch(""); setSingleUserId(""); setSingleReason(""); }}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors border-b border-border/30 group ${selectedGuild === g.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {g.icon ? <img src={g.icon} alt={g.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-muted-foreground">{g.name.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.memberCount?.toLocaleString()} members</div>
                  </div>
                  <ChevronRight className={`w-3 h-3 text-muted-foreground/50 shrink-0 transition-opacity ${selectedGuild === g.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedGuild ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Server className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{isConnected ? "Select a server from the sidebar" : "Connect your bot to get started"}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-border/50 bg-card/20 px-4 flex items-center gap-1 shrink-0">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
                <div className="ml-auto text-xs text-muted-foreground pr-2">
                  <span className="font-semibold text-foreground">{selectedGuildName}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                {/* NUKE TAB */}
                {activeTab === "nuke" && (
                  <div className="max-w-2xl space-y-4">
                    <Card className="bg-red-950/20 border-red-500/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-red-400 flex items-center gap-2">
                          <Skull className="w-5 h-5" /> Nuke Server
                        </CardTitle>
                        <CardDescription>Configure what the nuke will do to <strong className="text-foreground">{selectedGuildName}</strong>. All selected actions run in sequence.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {([
                            { key: "deleteChannels", label: "Delete All Channels", icon: <Trash2 className="w-4 h-4" />, color: "red" },
                            { key: "deleteRoles", label: "Delete All Roles", icon: <ShieldAlert className="w-4 h-4" />, color: "red" },
                            { key: "kickAll", label: "Kick All Members", icon: <UserMinus className="w-4 h-4" />, color: "orange" },
                            { key: "banAll", label: "Ban All Members", icon: <UserX className="w-4 h-4" />, color: "red" },
                            { key: "leaveAfter", label: "Leave After Nuke", icon: <LogOut className="w-4 h-4" />, color: "orange" },
                          ] as const).map(({ key, label, icon, color }) => (
                            <button
                              key={key}
                              onClick={() => toggleNuke(key as keyof typeof nukeOpts)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${nukeOpts[key as keyof typeof nukeOpts]
                                ? color === "red" ? "bg-red-500/15 border-red-500/50 text-red-300" : "bg-orange-500/15 border-orange-500/50 text-orange-300"
                                : "bg-black/30 border-border/50 text-muted-foreground hover:border-border"}`}
                            >
                              <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${nukeOpts[key as keyof typeof nukeOpts]
                                ? color === "red" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                                : "bg-muted/30"}`}>
                                {icon}
                              </div>
                              <span className="text-sm font-medium">{label}</span>
                              <div className={`ml-auto w-4 h-4 rounded border flex items-center justify-center shrink-0 ${nukeOpts[key as keyof typeof nukeOpts] ? "bg-primary border-primary" : "border-border"}`}>
                                {nukeOpts[key as keyof typeof nukeOpts] && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          ))}
                        </div>

                        <Button
                          variant="destructive"
                          className="w-full h-12 font-bold text-base bg-red-600 hover:bg-red-500 mt-2"
                          disabled={nukeMutation.isPending || !Object.values(nukeOpts).some(Boolean)}
                          onClick={handleNuke}
                        >
                          {nukeMutation.isPending ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Nuking...</>
                          ) : (
                            <><Skull className="w-4 h-4 mr-2" /> Execute Nuke</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* MEMBERS TAB */}
                {activeTab === "members" && (
                  <div className="space-y-4">
                    {/* Single User Action */}
                    <Card className="bg-card/40 border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Single User Action</CardTitle>
                        <CardDescription>Act on a specific user by their Discord ID</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            placeholder="User ID (e.g. 123456789012345678)"
                            value={singleUserId}
                            onChange={e => setSingleUserId(e.target.value)}
                            className="flex-1 bg-black/50 font-mono text-sm h-9"
                          />
                          <Input
                            placeholder="Reason (optional)"
                            value={singleReason}
                            onChange={e => setSingleReason(e.target.value)}
                            className="flex-1 bg-black/50 text-sm h-9"
                          />
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={handleKickUser} disabled={!singleUserId || kickUserMutation.isPending} className="border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 h-9">
                              <UserMinus className="w-4 h-4 mr-1" /> Kick
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleBanUser} disabled={!singleUserId || banUserMutation.isPending} className="border-red-500/40 hover:bg-red-500/10 hover:text-red-400 h-9">
                              <UserX className="w-4 h-4 mr-1" /> Ban
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleUnbanUser} disabled={!singleUserId || unbanUserMutation.isPending} className="border-green-500/40 hover:bg-green-500/10 hover:text-green-400 h-9">
                              <UserCheck className="w-4 h-4 mr-1" /> Unban
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Member List */}
                    <Card className="bg-card/40 border-border/50">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Member List ({allMembers.length})</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => refetchMembers()} disabled={isFetchingMembers} className="h-8 text-xs">
                          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetchingMembers ? "animate-spin" : ""}`} />
                          {isFetchingMembers ? "Loading..." : "Refresh"}
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="px-4 pb-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Search members..."
                              value={memberSearch}
                              onChange={e => setMemberSearch(e.target.value)}
                              className="pl-9 bg-black/50 text-sm h-8"
                            />
                            {memberSearch && (
                              <button onClick={() => setMemberSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {isFetchingMembers && allMembers.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">Loading members...</div>
                          ) : members.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">{memberSearch ? "No members match your search" : "No members found"}</div>
                          ) : members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 py-2 border-b border-border/30 hover:bg-white/5 group">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                {m.avatar ? <img src={m.avatar} alt={m.displayName} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-muted-foreground">{m.displayName.charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{m.displayName}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  @{m.username}
                                  {m.isBot && <span className="text-xs bg-primary/20 text-primary px-1 rounded">BOT</span>}
                                </div>
                              </div>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <Button size="sm" variant="ghost" onClick={() => handleMemberKick(m.id, m.username)} className="h-7 px-2 text-xs text-orange-400 hover:bg-orange-500/10">
                                  <UserMinus className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleMemberBan(m.id, m.username)} className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10">
                                  <UserX className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* MESSAGING TAB */}
                {activeTab === "messaging" && (
                  <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
                    <Card className="bg-card/40 border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Send className="w-4 h-4" /> Send to Channel</CardTitle>
                        <CardDescription>Post a message in a text channel</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                          <SelectTrigger className="bg-black/50 border-border h-9 text-sm">
                            <SelectValue placeholder="Select channel..." />
                          </SelectTrigger>
                          <SelectContent>
                            {channels.filter(c => c.type === 0).map(c => (
                              <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                            ))}
                            {channels.filter(c => c.type === 0).length === 0 && (
                              <SelectItem value="_none" disabled>No text channels</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Message content..."
                          className="min-h-[100px] bg-black/50 border-border resize-none text-sm"
                          value={messageContent}
                          onChange={e => setMessageContent(e.target.value)}
                        />
                        <Button onClick={handleSendMessage} disabled={!selectedChannel || !messageContent || sendMsgMutation.isPending} className="w-full h-9">
                          {sendMsgMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Sending...</> : <><Send className="w-3.5 h-3.5 mr-2" />Send Message</>}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> DM All Members</CardTitle>
                        <CardDescription>Send a direct message to every non-bot member</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="DM message content..."
                          className="min-h-[100px] bg-black/50 border-border resize-none text-sm"
                          value={dmMessage}
                          onChange={e => setDmMessage(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Note: many users have DMs disabled — failures are expected.</p>
                        <Button onClick={handleDmAll} disabled={!dmMessage || dmAllMutation.isPending} variant="outline" className="w-full h-9 border-primary/40 hover:bg-primary/10">
                          {dmAllMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Sending DMs...</> : <><MessageSquare className="w-3.5 h-3.5 mr-2" />DM All Members</>}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* MASS ACTIONS TAB */}
                {activeTab === "mass" && (
                  <div className="max-w-2xl space-y-3">
                    <p className="text-xs text-muted-foreground">All operations target <strong className="text-foreground">{selectedGuildName}</strong>. Each action requires confirmation.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {([
                        { label: "Nuke Channels", desc: "Delete all channels", icon: <Trash2 className="w-5 h-5" />, mutation: deleteChannelsMutation, color: "red" },
                        { label: "Nuke Roles", desc: "Delete all manageable roles", icon: <ShieldAlert className="w-5 h-5" />, mutation: deleteRolesMutation, color: "red" },
                        { label: "Mass Kick", desc: "Kick all kickable members", icon: <UserMinus className="w-5 h-5" />, mutation: kickMembersMutation, color: "orange" },
                        { label: "Mass Ban", desc: "Ban all bannable members", icon: <UserX className="w-5 h-5" />, mutation: banMembersMutation, color: "red" },
                        { label: "Unban All", desc: "Remove all server bans", icon: <UserCheck className="w-5 h-5" />, mutation: unbanAllMutation, color: "green" },
                        { label: "Leave Server", desc: "Bot leaves this server", icon: <LogOut className="w-5 h-5" />, mutation: leaveGuildMutation, color: "orange" },
                      ] as const).map(({ label, desc, icon, mutation, color }) => (
                        <button
                          key={label}
                          onClick={() => massAction(label, mutation, label)}
                          disabled={mutation.isPending}
                          className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${color === "red" ? "border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50" : color === "orange" ? "border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50" : "border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"} bg-black/30`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color === "red" ? "bg-red-500/15 text-red-400" : color === "orange" ? "bg-orange-500/15 text-orange-400" : "bg-green-500/15 text-green-400"}`}>
                            {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{label}</div>
                            <div className="text-xs text-muted-foreground">{desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Log — always visible */}
                <Card className="bg-black/60 border-border/30 shrink-0">
                  <CardHeader className="py-2 px-4 border-b border-border/30 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-mono text-muted-foreground">Action Log</span>
                    </div>
                    {logs.length > 0 && (
                      <button onClick={() => setLogs([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                    )}
                  </CardHeader>
                  <div className="max-h-36 overflow-y-auto p-2 font-mono text-xs">
                    {logs.length === 0 ? (
                      <div className="p-2 text-muted-foreground/40 flex items-center gap-2"><Clock className="w-3 h-3" /> Awaiting actions...</div>
                    ) : logs.map(log => (
                      <div key={log.id} className="flex gap-2 px-1.5 py-1 rounded hover:bg-white/5">
                        <span className="text-muted-foreground/50 shrink-0">[{log.time}]</span>
                        <span className={`${log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : log.type === "warn" ? "text-yellow-400" : "text-blue-400"}`}>
                          {log.type === "error" ? <XCircle className="w-3 h-3 inline mr-1" /> : log.type === "success" ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                          {log.msg}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent className="border-red-500/30 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">{confirmDialog.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={closeConfirm}>Cancel</Button>
            <Button variant="destructive" onClick={() => { confirmDialog.action(); closeConfirm(); }}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
