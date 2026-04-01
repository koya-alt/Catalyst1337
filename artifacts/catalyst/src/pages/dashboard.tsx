import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Zap, LogOut, RefreshCw, Server, Send, ShieldAlert, Trash2, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getGetBotChannelsQueryKey,
  useLeaveGuild,
  useDeleteChannels,
  useDeleteRoles,
  useKickAllMembers,
  useBanAllMembers,
  useSendMessage
} from "@workspace/api-client-react";

export default function DashboardPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Auth Check
  const { data: authStatus, isLoading: isAuthChecking } = useAuthCheck();
  useEffect(() => {
    if (!isAuthChecking && !authStatus?.loggedIn) {
      setLocation("/login");
    }
  }, [authStatus, isAuthChecking, setLocation]);

  const logoutMutation = useLogout();
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/")
    });
  };

  // Bot State
  const { data: botStatus, refetch: refetchStatus } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const isConnected = botStatus?.connected || false;
  const botUsername = botStatus?.username;

  const connectMutation = useConnectBot();
  const disconnectMutation = useDisconnectBot();
  
  const [token, setToken] = useState("");

  const handleConnect = () => {
    if (!token) return;
    connectMutation.mutate({ data: { token } }, {
      onSuccess: (res) => {
        if (res.success) {
          toast({ title: "Bot Connected", description: `Logged in as ${res.username}` });
          refetchStatus();
          refetchGuilds();
        } else {
          toast({ title: "Connection Failed", description: res.error, variant: "destructive" });
        }
      }
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Bot Disconnected" });
        refetchStatus();
        setSelectedGuild(null);
      }
    });
  };

  // Guilds State
  const { data: guildsData, refetch: refetchGuilds } = useGetBotGuilds({ query: { enabled: isConnected } });
  const guilds = guildsData?.guilds || [];
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);

  // Channels State
  const { data: channelsData } = useGetBotChannels(
    { guildId: selectedGuild || "" }, 
    { query: { enabled: !!selectedGuild && isConnected, queryKey: getGetBotChannelsQueryKey({ guildId: selectedGuild || "" }) } }
  );
  const channels = channelsData?.channels || [];

  // Logs
  const [logs, setLogs] = useState<Array<{id: number, time: string, msg: string, type: 'success'|'error'|'info'|'warn'}>>([]);
  const addLog = (msg: string, type: 'success'|'error'|'info'|'warn' = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  // Actions
  const leaveGuildMutation = useLeaveGuild();
  const deleteChannelsMutation = useDeleteChannels();
  const deleteRolesMutation = useDeleteRoles();
  const kickMembersMutation = useKickAllMembers();
  const banMembersMutation = useBanAllMembers();
  const sendMsgMutation = useSendMessage();

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, desc: string, action: () => void}>({
    isOpen: false, title: "", desc: "", action: () => {}
  });

  const requestConfirm = (title: string, desc: string, action: () => void) => {
    setConfirmDialog({ isOpen: true, title, desc, action });
  };

  const executeAction = (mutation: any, name: string) => {
    if (!selectedGuild) return;
    mutation.mutate({ data: { guildId: selectedGuild } }, {
      onSuccess: (res: any) => {
        if (res.success) {
          addLog(`${name} successful. ${res.message || ''}`, 'success');
          if (name === "Leave Server") {
            setSelectedGuild(null);
            refetchGuilds();
          }
        } else {
          addLog(`${name} failed: ${res.error}`, 'error');
        }
      },
      onError: (err: any) => addLog(`${name} error: ${err.message}`, 'error')
    });
  };

  // Send Message State
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");

  const handleSendMessage = () => {
    if (!selectedGuild || !selectedChannel || !messageContent) return;
    sendMsgMutation.mutate({ data: { guildId: selectedGuild, channelId: selectedChannel, message: messageContent } }, {
      onSuccess: (res) => {
        if (res.success) {
          addLog(`Message sent to channel ${selectedChannel}`, 'success');
          setMessageContent("");
        } else {
          addLog(`Failed to send message: ${res.error}`, 'error');
        }
      },
      onError: (err) => addLog(`Error sending message: ${err.message}`, 'error')
    });
  };


  if (isAuthChecking || !authStatus?.loggedIn) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-border/50 bg-card/50 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">Bot Control Panel</span>
          
          <div className="flex items-center gap-2 ml-6 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-muted-foreground">
              {isConnected ? `Online as ${botUsername}` : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Homepage
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Connection Card */}
        <Card className="bg-card/40 border-border/50 shrink-0">
          <CardHeader className="pb-4">
            <CardTitle>Bot Connection</CardTitle>
            <CardDescription>Enter your Discord bot token to connect</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input 
                type="password" 
                placeholder="Bot Token (e.g. MTEw...)" 
                value={token}
                onChange={e => setToken(e.target.value)}
                disabled={isConnected}
                className="flex-1 font-mono text-sm bg-black/50"
              />
              {!isConnected ? (
                <Button onClick={handleConnect} disabled={connectMutation.isPending || !token}>
                  {connectMutation.isPending ? "Connecting..." : "Connect Bot"}
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleDisconnect} disabled={disconnectMutation.isPending}>
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isConnected && (
          <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Servers List */}
            <Card className="bg-card/40 border-border/50 lg:col-span-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div>
                  <CardTitle>Servers ({guilds.length})</CardTitle>
                  <CardDescription>Select a server to manage</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => refetchGuilds()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="flex flex-col">
                  {guilds.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <Server className="w-8 h-8 mb-2 opacity-20" />
                      <p>Bot is not in any servers</p>
                    </div>
                  ) : (
                    guilds.map(g => (
                      <button 
                        key={g.id}
                        onClick={() => { setSelectedGuild(g.id); setSelectedChannel(""); }}
                        className={`w-full text-left p-4 flex items-center gap-3 border-b border-border/50 hover:bg-white/5 transition-colors ${selectedGuild === g.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#2b2d31] flex items-center justify-center shrink-0 overflow-hidden">
                          {g.icon ? (
                            <img src={g.icon} alt={g.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-muted-foreground">{g.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 truncate">
                          <div className="font-semibold truncate">{g.name}</div>
                          <div className="text-xs text-muted-foreground">{g.memberCount} members</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Panel */}
            <div className="lg:col-span-2 flex flex-col gap-6 h-full">
              <Card className={`bg-card/40 border-border/50 shrink-0 ${!selectedGuild ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardHeader>
                  <CardTitle>Control Panel</CardTitle>
                  <CardDescription>
                    {selectedGuild ? `Managing: ${guilds.find(g => g.id === selectedGuild)?.name}` : "Select a server first"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="actions">
                    <TabsList className="mb-4 bg-black/50">
                      <TabsTrigger value="actions">Quick Actions</TabsTrigger>
                      <TabsTrigger value="message">Send Message</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="actions" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="h-16 justify-start px-4 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-500"
                          onClick={() => requestConfirm("Leave Server", "Are you sure you want the bot to leave this server?", () => executeAction(leaveGuildMutation, "Leave Server"))}
                        >
                          <LogOut className="w-5 h-5 mr-3 text-orange-500" />
                          <div className="text-left">
                            <div className="font-semibold">Leave Server</div>
                            <div className="text-xs opacity-70">Bot leaves gracefully</div>
                          </div>
                        </Button>

                        <Button 
                          variant="outline" 
                          className="h-16 justify-start px-4 border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => requestConfirm("Delete Channels", "This will delete ALL channels in the server. This is irreversible!", () => executeAction(deleteChannelsMutation, "Delete Channels"))}
                        >
                          <Trash2 className="w-5 h-5 mr-3 text-red-500" />
                          <div className="text-left">
                            <div className="font-semibold">Nuke Channels</div>
                            <div className="text-xs opacity-70">Deletes all channels</div>
                          </div>
                        </Button>

                        <Button 
                          variant="outline" 
                          className="h-16 justify-start px-4 border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => requestConfirm("Delete Roles", "This will delete ALL manageable roles. This is irreversible!", () => executeAction(deleteRolesMutation, "Delete Roles"))}
                        >
                          <ShieldAlert className="w-5 h-5 mr-3 text-red-500" />
                          <div className="text-left">
                            <div className="font-semibold">Nuke Roles</div>
                            <div className="text-xs opacity-70">Deletes all roles</div>
                          </div>
                        </Button>

                        <Button 
                          variant="outline" 
                          className="h-16 justify-start px-4 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-500"
                          onClick={() => requestConfirm("Kick Members", "This will kick as many members as possible. Proceed with caution.", () => executeAction(kickMembersMutation, "Kick Members"))}
                        >
                          <Users className="w-5 h-5 mr-3 text-orange-500" />
                          <div className="text-left">
                            <div className="font-semibold">Mass Kick</div>
                            <div className="text-xs opacity-70">Kicks all members</div>
                          </div>
                        </Button>

                        <Button 
                          variant="outline" 
                          className="h-16 justify-start px-4 border-red-500/30 hover:bg-red-500/10 hover:text-red-500 md:col-span-2"
                          onClick={() => requestConfirm("Ban Members", "This will BAN all members. This is highly destructive!", () => executeAction(banMembersMutation, "Ban Members"))}
                        >
                          <AlertTriangle className="w-5 h-5 mr-3 text-red-500" />
                          <div className="text-left">
                            <div className="font-semibold">Mass Ban</div>
                            <div className="text-xs opacity-70">Bans all members</div>
                          </div>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="message" className="space-y-4">
                      <div className="space-y-2">
                        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                          <SelectTrigger className="bg-black/50 border-border">
                            <SelectValue placeholder="Select a text channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {channels.filter(c => c.type === 0).map(c => (
                              <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                            ))}
                            {channels.filter(c => c.type === 0).length === 0 && (
                              <SelectItem value="none" disabled>No text channels found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="Type your message here..." 
                          className="min-h-[120px] bg-black/50 border-border resize-none"
                          value={messageContent}
                          onChange={e => setMessageContent(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleSendMessage} disabled={!selectedChannel || !messageContent || sendMsgMutation.isPending} className="w-full">
                        <Send className="w-4 h-4 mr-2" /> 
                        {sendMsgMutation.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Action Log */}
              <Card className="bg-card/40 border-border/50 flex-1 flex flex-col overflow-hidden min-h-[250px]">
                <CardHeader className="pb-2 shrink-0 border-b border-border/50 bg-black/20">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Action Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto font-mono text-xs bg-black/60">
                  {logs.length === 0 ? (
                    <div className="p-4 text-muted-foreground/50">Awaiting actions...</div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {logs.map(log => (
                        <div key={log.id} className="flex gap-3 p-1.5 rounded hover:bg-white/5">
                          <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                          <span className={`
                            ${log.type === 'error' ? 'text-red-400' : ''}
                            ${log.type === 'success' ? 'text-green-400' : ''}
                            ${log.type === 'warn' ? 'text-yellow-400' : ''}
                            ${log.type === 'info' ? 'text-blue-400' : ''}
                          `}>
                            {log.msg}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="border-red-500/30 bg-card">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {confirmDialog.desc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              confirmDialog.action();
              setConfirmDialog(prev => ({...prev, isOpen: false}));
            }}>
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
