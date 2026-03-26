import { useEffect, useState } from "react";
import { useSaveUserProfile, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export type ThemePreset = "ocean" | "forest" | "sunset" | "purple" | "rose" | "custom";

const presets: Record<string, { primary: string; ring: string }> = {
  ocean: { primary: "230 60% 40%", ring: "230 60% 40%" }, // Default Indigo
  forest: { primary: "150 50% 35%", ring: "150 50% 35%" }, // Green
  sunset: { primary: "15 75% 55%", ring: "15 75% 55%" }, // Orange/Red
  purple: { primary: "270 50% 45%", ring: "270 50% 45%" }, // Purple
  rose: { primary: "330 60% 50%", ring: "330 60% 50%" }, // Pink
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
