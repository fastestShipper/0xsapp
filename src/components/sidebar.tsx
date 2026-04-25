"use client";
import { Home, Users, Store, Archive, Settings, Bell, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const items = [
  { id: "chats", icon: Home, label: "Chats" },
  { id: "roster", icon: Users, label: "Mi equipo" },
  { id: "marketplace", icon: Store, label: "Marketplace" },
  { id: "archive", icon: Archive, label: "Archivo" },
  { id: "notifications", icon: Bell, label: "Notificaciones" },
];

export function Sidebar({ active = "chats" }: { active?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <aside className="w-[68px] shrink-0 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] border-r flex flex-col items-center py-4 gap-2">
      <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30 rotate-45">
        <span className="-rotate-45 text-[15px] font-black tracking-tighter">cA</span>
      </div>
      <div className="mt-4 flex flex-col gap-1 flex-1">
        {items.map((it) => (
          <button
            key={it.id}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center transition-all relative group",
              active === it.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
            title={it.label}
          >
            <it.icon size={18} />
            <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {it.label}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="h-11 w-11 rounded-xl flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
        title="Cambiar tema"
        suppressHydrationWarning
      >
        {mounted ? (resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : <Moon size={18} />}
      </button>
      <button className="h-11 w-11 rounded-xl flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-all" title="Configuración">
        <Settings size={18} />
      </button>
    </aside>
  );
}
