"use client";

import { useState, useEffect } from "react";
import { Settings, X, Palette, Sliders, Download, Upload, Trash2, Check, Image as ImageIcon, Eye } from "lucide-react";

export interface UserPreferences {
  theme:
    | "cyberpunk"
    | "matrix"
    | "sunset"
    | "oled"
    | "nord"
    | "dracula"
    | "solarized"
    | "rose-pine"
    | "synthwave"
    | "monokai";
  accentColor: string;
  customWallpaper: string;
  bgOpacity: number;
  defaultEngine: "all" | "google" | "youtube" | "duckduckgo" | "wikipedia" | "github" | "reddit";
  resultsCount: number;
  openInNewTab: boolean;
  compactMode: boolean;
}

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

const THEMES = [
  { id: "cyberpunk", name: "Cyberpunk", color: "bg-cyan-500", accent: "#06b6d4" },
  { id: "matrix", name: "Matrix", color: "bg-emerald-500", accent: "#10b981" },
  { id: "sunset", name: "Sunset", color: "bg-purple-500", accent: "#a855f7" },
  { id: "oled", name: "Pure OLED", color: "bg-neutral-950 border border-neutral-700", accent: "#3b82f6" },
  { id: "nord", name: "Nord Chill", color: "bg-sky-400", accent: "#38bdf8" },
  { id: "dracula", name: "Dracula", color: "bg-pink-500", accent: "#ec4899" },
  { id: "solarized", name: "Solarized", color: "bg-yellow-600", accent: "#eab308" },
  { id: "rose-pine", name: "Rosé Pine", color: "bg-rose-400", accent: "#fb7185" },
  { id: "synthwave", name: "Synthwave '84", color: "bg-fuchsia-500", accent: "#d946ef" },
  { id: "monokai", name: "Monokai Pro", color: "bg-amber-500", accent: "#f59e0b" },
] as const;

interface Props {
  prefs: UserPreferences;
  onUpdatePrefs: (newPrefs: UserPreferences) => void;
  onClearData: () => void;
}

export default function SettingsDrawer({ prefs, onUpdatePrefs, onClearData }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(prefs);

  useEffect(() => {
    setLocalPrefs(prefs);
  }, [prefs]);

  const update = (key: keyof UserPreferences, value: any) => {
    const updated = { ...localPrefs, [key]: value };
    setLocalPrefs(updated);
    onUpdatePrefs(updated);
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB to preserve performance.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      update("customWallpaper", event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(localPrefs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "z-search-settings.json";
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setLocalPrefs(imported);
        onUpdatePrefs(imported);
      } catch (err) {
        alert("Invalid JSON settings file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ borderColor: localPrefs.accentColor }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border rounded-full shadow-2xl backdrop-blur-xl transition-all duration-200 group"
      >
        <Settings style={{ color: localPrefs.accentColor }} className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        <span className="text-xs font-semibold tracking-wider">Preferences</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-neutral-950/95 border-l border-neutral-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl backdrop-blur-2xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-neutral-800 mb-6">
                <div className="flex items-center gap-2">
                  <Sliders style={{ color: localPrefs.accentColor }} className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">Engine Preferences</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 10 Theme Presets */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    <Palette style={{ color: localPrefs.accentColor }} className="w-4 h-4" /> Accent Theme Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          update("theme", t.id);
                          update("accentColor", t.accent);
                        }}
                        style={{
                          borderColor: localPrefs.theme === t.id ? localPrefs.accentColor : undefined,
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          localPrefs.theme === t.id
                            ? "bg-neutral-800/80 text-white"
                            : "border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${t.color}`} />
                          {t.name}
                        </span>
                        {localPrefs.theme === t.id && (
                          <Check style={{ color: localPrefs.accentColor }} className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Opacity Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Eye style={{ color: localPrefs.accentColor }} className="w-3.5 h-3.5" /> UI Card Transparency
                    </span>
                    <span style={{ color: localPrefs.accentColor }} className="font-mono">
                      {localPrefs.bgOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={localPrefs.bgOpacity ?? 60}
                    onChange={(e) => update("bgOpacity", Number(e.target.value))}
                    className="w-full cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Custom Accent Glow Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Custom Accent Glow
                  </span>
                  <input
                    type="color"
                    value={localPrefs.accentColor || "#06b6d4"}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>

                {/* Custom Wallpaper Upload */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    <ImageIcon style={{ color: localPrefs.accentColor }} className="w-3.5 h-3.5" /> Custom Wallpaper
                  </label>
                  <div className="flex gap-2 items-center">
                    <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-medium cursor-pointer transition-colors">
                      <Upload style={{ color: localPrefs.accentColor }} className="w-3.5 h-3.5" /> Choose Image from PC
                      <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
                    </label>

                    {localPrefs.customWallpaper && (
                      <button
                        onClick={() => update("customWallpaper", "")}
                        className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <hr className="border-neutral-800" />

                {/* Search Source Selector */}
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-3">
                    Default Search Source
                  </label>
                  <select
                    value={localPrefs.defaultEngine}
                    onChange={(e) => update("defaultEngine", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none"
                  >
                    <option value="all">All Sources (Aggregated)</option>
                    <option value="google">Google</option>
                    <option value="youtube">YouTube</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="wikipedia">Wikipedia</option>
                    <option value="github">GitHub</option>
                    <option value="reddit">Reddit</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-300">Results Per Source</span>
                    <span style={{ color: localPrefs.accentColor }} className="font-mono">{localPrefs.resultsCount}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={localPrefs.resultsCount}
                    onChange={(e) => update("resultsCount", Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <hr className="border-neutral-800" />

                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-neutral-300">Open Links in New Tab</span>
                    <input
                      type="checkbox"
                      checked={localPrefs.openInNewTab}
                      onChange={(e) => update("openInNewTab", e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-neutral-300">Compact Result Cards</span>
                    <input
                      type="checkbox"
                      checked={localPrefs.compactMode}
                      onChange={(e) => update("compactMode", e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-800 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
                <label className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Import JSON
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              <button
                onClick={onClearData}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Preferences & Clear Storage
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}