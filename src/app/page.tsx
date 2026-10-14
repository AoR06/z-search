"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Shield, Sparkles, SlidersHorizontal, Terminal, Command } from "lucide-react";
import { SearchResultItem } from "./components/DraggableResults";
import SettingsDrawer, { UserPreferences } from "./components/SettingsDrawer";

const DraggableResults = dynamic(() => import("./components/DraggableResults"), { ssr: false });

const DEFAULT_PREFS: UserPreferences = {
  theme: "cyberpunk",
  accentColor: "#06b6d4",
  customWallpaper: "",
  bgOpacity: 60,
  defaultEngine: "all",
  resultsCount: 5,
  openInNewTab: true,
  compactMode: false,
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "google" | "youtube" | "duckduckgo" | "wikipedia" | "github" | "reddit"
  >("all");
  const [commandHint, setCommandHint] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("z_search_preferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPrefs(parsed);
        setActiveFilter(parsed.defaultEngine || "all");
      } catch (e) {
        console.error("Failed to parse local preferences", e);
      }
    }
  }, []);

  const handleUpdatePrefs = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem("z_search_preferences", JSON.stringify(newPrefs));
  };

  const handleClearData = () => {
    localStorage.clear();
    setPrefs(DEFAULT_PREFS);
    setResults([]);
    setActiveFilter("all");
    alert("Preferences and cached search state reset!");
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.startsWith("/g ")) setCommandHint("Quick Mode: Directing search to Google");
    else if (val.startsWith("/yt ")) setCommandHint("Quick Mode: Directing search to YouTube");
    else if (val.startsWith("/gh ")) setCommandHint("Quick Mode: Directing search to GitHub Repositories");
    else if (val.startsWith("/wiki ")) setCommandHint("Quick Mode: Directing search to Wikipedia");
    else if (val.startsWith("/reddit ")) setCommandHint("Quick Mode: Directing search to Reddit");
    else if (val.startsWith("/ddg ")) setCommandHint("Quick Mode: Directing search to DuckDuckGo");
    else setCommandHint(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    let targetQuery = query;
    let overrideFilter: typeof activeFilter = activeFilter;

    if (query.startsWith("/g ")) {
      targetQuery = query.replace("/g ", "").trim();
      overrideFilter = "google";
    } else if (query.startsWith("/yt ")) {
      targetQuery = query.replace("/yt ", "").trim();
      overrideFilter = "youtube";
    } else if (query.startsWith("/gh ")) {
      targetQuery = query.replace("/gh ", "").trim();
      overrideFilter = "github";
    } else if (query.startsWith("/wiki ")) {
      targetQuery = query.replace("/wiki ", "").trim();
      overrideFilter = "wikipedia";
    } else if (query.startsWith("/reddit ")) {
      targetQuery = query.replace("/reddit ", "").trim();
      overrideFilter = "reddit";
    } else if (query.startsWith("/ddg ")) {
      targetQuery = query.replace("/ddg ", "").trim();
      overrideFilter = "duckduckgo";
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(targetQuery)}&limit=${prefs.resultsCount}`);
      const data = await res.json();
      setResults(data.results || []);
      setActiveFilter(overrideFilter);
    } catch (err) {
      console.error("Failed to fetch search results", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((item) =>
    activeFilter === "all" ? true : item.source === activeFilter
  );

  const alpha = (prefs.bgOpacity ?? 60) / 100;
  const dynamicBgStyle = {
    backgroundColor: `rgba(20, 20, 20, ${alpha})`,
    backdropFilter: alpha < 1 ? "blur(12px)" : "none",
  };

  const accentHex = prefs.accentColor || "#06b6d4";

  return (
    <main
      style={{
        backgroundImage: prefs.customWallpaper ? `url(${prefs.customWallpaper})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
      className={`min-h-screen text-neutral-100 selection:bg-cyan-500 selection:text-black relative transition-all duration-300 ${
        !prefs.customWallpaper ? "bg-neutral-950" : ""
      }`}
    >
      {/* Background Radial Glow ONLY when NO wallpaper is active */}
      {!prefs.customWallpaper && prefs.theme !== "oled" && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
          <div
            style={{
              backgroundColor: accentHex,
              opacity: 0.18,
            }}
            className="w-[600px] h-[600px] rounded-full blur-[140px] transition-all duration-500"
          />
        </div>
      )}

      {/* Dim overlay when wallpaper is active to preserve text contrast */}
      {prefs.customWallpaper && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none z-0" />
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div
              style={{
                backgroundColor: `${accentHex}20`,
                borderColor: `${accentHex}40`,
                color: accentHex,
              }}
              className="p-2 rounded-xl border transition-colors"
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-wider text-white">
              Z-SEARCH<span style={{ color: accentHex }}>.</span>
            </span>
          </div>

          <div
            style={dynamicBgStyle}
            className="flex items-center gap-2 text-xs text-neutral-400 px-3 py-1.5 rounded-full border border-neutral-800/80"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Data Proxy Active</span>
          </div>
        </header>

        {/* Search Input */}
        <section className="mb-4">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search or type /g, /yt, /gh, /wiki, /reddit, /ddg..."
              style={dynamicBgStyle}
              className="w-full border border-neutral-800/80 rounded-2xl py-4 pl-12 pr-28 text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-all duration-300 text-lg shadow-2xl"
            />
            <Search
              style={{ color: query ? accentHex : undefined }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: accentHex,
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 text-black font-semibold rounded-xl text-sm transition-all duration-200 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {commandHint && (
            <div
              style={{
                backgroundColor: `${accentHex}15`,
                borderColor: `${accentHex}30`,
                color: accentHex,
              }}
              className="mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{commandHint}</span>
            </div>
          )}
        </section>

        {/* Command Quick Buttons */}
        <div className="flex items-center gap-3 mb-8 text-[11px] text-neutral-500 overflow-x-auto pb-1">
          <span className="flex items-center gap-1 font-mono text-neutral-400">
            <Command className="w-3 h-3" /> Commands:
          </span>
          {["/g", "/yt", "/gh", "/wiki", "/reddit", "/ddg"].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleInputChange(`${cmd} `)}
              style={dynamicBgStyle}
              className="hover:text-white font-mono px-2 py-0.5 rounded border border-neutral-800/80 transition-colors"
            >
              {cmd} [query]
            </button>
          ))}
        </div>

        {/* Source Filter Tabs */}
        {results.length > 0 && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800/60">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                Source Filter:
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "google", "youtube", "duckduckgo", "wikipedia", "github", "reddit"] as const).map(
                (source) => (
                  <button
                    key={source}
                    onClick={() => setActiveFilter(source)}
                    style={
                      activeFilter === source
                        ? {
                            backgroundColor: `${accentHex}25`,
                            borderColor: `${accentHex}50`,
                            color: "#ffffff",
                          }
                        : dynamicBgStyle
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all border ${
                      activeFilter === source
                        ? ""
                        : "text-neutral-400 hover:text-white border-neutral-800/80"
                    }`}
                  >
                    {source}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Results Area */}
        <section className="flex-1">
          {filteredResults.length > 0 ? (
            <DraggableResults items={filteredResults} />
          ) : (
            !loading && (
              <div
                style={dynamicBgStyle}
                className="text-center py-20 border border-dashed border-neutral-800/80 rounded-2xl"
              >
                <p className="text-neutral-500 text-sm">
                  Enter a query or run commands like{" "}
                  <code style={{ color: accentHex }}>/yt vercel</code> to search YouTube directly.
                </p>
              </div>
            )
          )}
        </section>
      </div>

      <SettingsDrawer prefs={prefs} onUpdatePrefs={handleUpdatePrefs} onClearData={handleClearData} />
    </main>
  );
}