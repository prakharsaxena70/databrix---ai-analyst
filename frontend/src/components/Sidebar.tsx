"use client";

import { SessionData, User } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Database,
  Trash2,
  Plus,
  PanelLeftClose,
  Search,
  Settings2,
  Wrench,
  LogOut,
  Globe,
  MoreVertical,
  Star,
  Edit2,
  User as UserIcon,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sessions: SessionData[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onUpdateSession: (id: string, updates: { nickname?: string; is_starred?: boolean }) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onShowPricing: () => void;
  onShowTools: () => void;
  onShowDataSources: () => void;
  user: User | null;
  onLogout: () => void;
  isAuthenticated: boolean;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onUpdateSession,
  onDeleteSession,
  onNewChat,
  isOpen,
  onToggle,
  onShowPricing,
  onShowTools,
  onShowDataSources,
  user,
  onLogout,
  isAuthenticated,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredSessions = sessions.filter(s => 
    s.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-[#0f1117] border-r border-white/5 transition-all duration-500 ease-out shrink-0 overflow-hidden relative",
        isOpen ? "w-[300px]" : "w-0 border-r-0"
      )}
    >
      <div className="w-[300px] h-full flex flex-col">
        {/* Premium Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-lg font-black">B</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">DataBrix</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle} 
            className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
             <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>

        {/* Premium Navigation */}
        <div className="px-4 space-y-1 mb-8">
           <div className="group relative px-3 h-11 flex items-center gap-3 bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer rounded-xl transition-all mb-4">
             <Search className="h-4 w-4 shrink-0 transition-transform group-focus-within:scale-110" />
             <input 
               type="text" 
               placeholder="Search analyses..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-500"
             />
           </div>
           
           <button 
             onClick={onNewChat}
             className="w-full flex items-center gap-3 px-4 h-12 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-bold text-sm shadow-lg shadow-blue-500/20 group"
           >
             <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-4 w-4 shrink-0" />
             </div>
             New Analysis
           </button>

           <div 
             onClick={onShowDataSources}
             className="flex items-center gap-3 px-4 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm cursor-pointer group mt-2"
           >
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <Database className="h-4 w-4 shrink-0" />
             </div>
             Data Sources
           </div>
           
           <div 
             onClick={onShowTools}
             className="flex items-center gap-3 px-4 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-sm cursor-pointer group"
           >
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <Wrench className="h-4 w-4 shrink-0" />
             </div>
             Tools
           </div>
        </div>

        <Separator className="opacity-10 mb-6 mx-4 w-auto bg-slate-700" />

        {/* Sessions Section - Premium */}
        <div className="flex-1 flex flex-col min-h-0 px-3 overflow-hidden">
          <div className="px-3 mb-3 flex items-center justify-between">
             <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Analysis History</p>
             <span className="text-[10px] text-slate-600 font-medium">{filteredSessions.length}</span>
          </div>
          
          <ScrollArea className="flex-1 pr-1">
            <div className="space-y-1">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {isAuthenticated ? "No analyses yet" : "Sign in to save analyses"}
                  </p>
                </div>
              ) : (
                filteredSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/app/chat/${s.id}`}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all no-underline",
                      s.id === activeSessionId
                        ? "bg-white/10 border border-white/10"
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      s.id === activeSessionId ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-white/5"
                    )}>
                      <FileSpreadsheet className={cn(
                        "h-4 w-4",
                        s.id === activeSessionId ? "text-white" : "text-slate-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[13px] font-semibold truncate",
                        s.id === activeSessionId ? "text-white" : "text-slate-300"
                      )}>
                        {s.nickname || s.filename.replace(/\.[^/.]+$/, "")}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {formatDate(s.created_at || "")}
                      </p>
                    </div>
                    
                    {s.is_starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(ev: any) => ev.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg">
                           <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-[#1a1d24] border-white/10 rounded-xl p-1.5">
                         <DropdownMenuItem 
                           onClick={() => onUpdateSession(s.id, { is_starred: !s.is_starred })}
                           className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 gap-2 cursor-pointer hover:bg-white/5 hover:text-white"
                         >
                            <Star className={cn("h-3.5 w-3.5", s.is_starred ? "fill-amber-400 text-amber-400" : "")} /> 
                            {s.is_starred ? "Unstar" : "Add to Starred"}
                         </DropdownMenuItem>
                         <DropdownMenuItem 
                           onClick={() => {
                             const name = prompt("Rename analysis:", s.nickname || s.filename);
                             if (name) onUpdateSession(s.id, { nickname: name });
                           }}
                           className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 gap-2 cursor-pointer hover:bg-white/5 hover:text-white"
                         >
                            <Edit2 className="h-3.5 w-3.5" /> Rename
                         </DropdownMenuItem>
                         <DropdownMenuSeparator className="bg-white/10" />
                         <DropdownMenuItem 
                           onClick={() => onDeleteSession(s.id)}
                           className="rounded-lg px-3 py-2 text-xs font-medium text-red-400 gap-2 cursor-pointer hover:bg-red-500/10 hover:text-red-300"
                         >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Premium Footer */}
        <div className="p-4 mt-auto border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent">


           <div className="space-y-3">
              {/* Global Actions */}
              <div className="flex items-center justify-between text-slate-500">
                 <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                       <Globe className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider">English</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-slate-500 hover:text-white transition-all">
                       <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    {isAuthenticated && (
                      <button 
                        onClick={onLogout}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-slate-500 hover:text-red-400 transition-all"
                      >
                         <LogOut className="h-3.5 w-3.5" />
                      </button>
                    )}
                 </div>
              </div>

              {/* User Identity */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                   <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      {getInitials(user.full_name || user.email)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">
                        {user.full_name || user.email.split("@")[0]}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
                   </div>
                   <button className="text-slate-500 hover:text-white transition-colors">
                      <MoreVertical className="h-4 w-4" />
                   </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                   <Link href="/auth/login" className="flex-1">
                     <Button variant="outline" className="w-full rounded-xl font-bold text-xs bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20">
                       <UserIcon className="h-4 w-4 mr-2" /> Sign In
                     </Button>
                   </Link>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
