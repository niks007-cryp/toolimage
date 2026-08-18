/** ToolImage theme context — preserves the Monochrome Instrument system with an opt-in local display preference only. */
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";
type ThemeContextValue = { theme: ThemeMode; toggleTheme: () => void; };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "toolimage-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try { return window.localStorage.getItem(storageKey) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.style.colorScheme = theme; try { window.localStorage.setItem(storageKey, theme); } catch { /* Private browsing may deny storage; the in-memory preference still works. */ } }, [theme]);
  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light") }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("useTheme must be used inside ThemeProvider"); return value; }
