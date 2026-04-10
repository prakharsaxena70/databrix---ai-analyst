"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import { getUserSessions, deleteSession as apiDeleteSession } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { SessionData } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Extract session ID from pathname
  const activeSessionId = pathname?.startsWith("/app/chat/") 
    ? pathname.split("/").pop() || null
    : null;

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const data = await getUserSessions();
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleSelectSession = (id: string) => {
    // Navigation is handled by Link component
    console.log("Selected session:", id);
  };

  const handleUpdateSession = (id: string, updates: { nickname?: string; is_starred?: boolean }) => {
    setSessions(prev => 
      prev.map(s => (s.id === id || s.session_id === id) ? { ...s, ...updates } : s)
    );
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await apiDeleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id && s.session_id !== id));
      
      // If we're on the deleted session's page, redirect to main app
      if (activeSessionId === id) {
        router.push("/app");
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleNewChat = () => {
    router.push("/app");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1117]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0f1117] overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onUpdateSession={handleUpdateSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onShowTools={() => router.push("/app/tools")}
        onShowDataSources={() => router.push("/app/data-sources")}
        user={user}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
      />
      
      {/* Sidebar Toggle Button - Visible when sidebar is collapsed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#1a1d24] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center shadow-lg"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
