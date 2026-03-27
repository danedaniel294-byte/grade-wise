import { useEffect, useState } from "react";
import { useSaveUserProfile, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export type ThemePreset =
  | "ocean" | "forest" | "sunset" | "purple" | "rose"
  | "gold" | "midnight" | "crimson" | "teal" | "coffee"
  | "slate" | "mint" | "coral" | "electric" | "emerald" | "custom";

export const presets: Record<string, { primary: string; ring: string; label: string; hex: string }> = {
  ocean:    { primary: "230 60% 45%", ring: "230 60% 45%", label: "Ocean",    hex: "#3B5BE8" },
  forest:   { primary: "150 50% 35%", ring: "150 50% 35%", label: "Forest",   hex: "#2D8C5E" },
  sunset:   { primary: "15 75% 55%",  ring: "15 75% 55%",  label: "Sunset",   hex: "#E8673B" },
  purple:   { primary: "270 50% 45%", ring: "270 50% 45%", label: "Purple",   hex: "#7345B8" },
  rose:     { primary: "330 60% 50%", ring: "330 60% 50%", label: "Rose",     hex: "#E84080" },
  gold:     { primary: "40 90% 45%",  ring: "40 90% 45%",  label: "Gold",     hex: "#D4920A" },
  midnight: { primary: "220 80% 25%", ring: "220 80% 25%", label: "Midnight", hex: "#0D2670" },
  crimson:  { primary: "0 70% 42%",   ring: "0 70% 42%",   label: "Crimson",  hex: "#B31717" },
  teal:     { primary: "175 65% 38%", ring: "175 65% 38%", label: "Teal",     hex: "#1A9E8E" },
  coffee:   { primary: "25 50% 35%",  ring: "25 50% 35%",  label: "Coffee",   hex: "#7A4A1F" },
  slate:    { primary: "210 30% 40%", ring: "210 30% 40%", label: "Slate",    hex: "#4A6580" },
  mint:     { primary: "160 55% 42%", ring: "160 55% 42%", label: "Mint",     hex: "#2B9E74" },
  coral:    { primary: "10 80% 58%",  ring: "10 80% 58%",  label: "Coral",    hex: "#EF5A3C" },
  electric: { primary: "195 90% 42%", ring: "195 90% 42%", label: "Electric", hex: "#0AA6C9" },
  emerald:  { primary: "145 60% 38%", ring: "145 60% 38%", label: "Emerald",  hex: "#269E58" },
};

export function useTheme() {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { mutate: saveProfile } = useSaveUserProfile();

  const [activeTheme, setActiveTheme] = useState<ThemePreset>("ocean");

  useEffect(() => {
    if (user?.themeColor && presets[user.themeColor]) {
      setActiveTheme(user.themeColor as ThemePreset);
      applyThemeToRoot(presets[user.themeColor].primary);
    } else if (user?.themeColor === "custom" && user.customPrimaryColor) {
      setActiveTheme("custom");
      applyThemeToRoot(user.customPrimaryColor);
    } else {
      applyThemeToRoot(presets.ocean.primary);
    }
  }, [user?.themeColor, user?.customPrimaryColor]);

  const applyThemeToRoot = (primaryHsl: string) => {
    document.documentElement.style.setProperty("--primary", primaryHsl);
    document.documentElement.style.setProperty("--ring", primaryHsl);
  };

  const setTheme = (theme: ThemePreset, customHsl?: string) => {
    setActiveTheme(theme);
    if (theme === "custom" && customHsl) {
      applyThemeToRoot(customHsl);
      saveProfile(
        { data: { themeColor: theme, customPrimaryColor: customHsl } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }) }
      );
    } else if (presets[theme]) {
      applyThemeToRoot(presets[theme].primary);
      saveProfile(
        { data: { themeColor: theme } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }) }
      );
    }
  };

  return { activeTheme, setTheme, presets };
}
