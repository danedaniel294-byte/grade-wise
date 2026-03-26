import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("pwa_banner_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    try { localStorage.setItem("pwa_banner_dismissed", "1"); } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed top-16 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/30 px-5 py-3 flex items-center gap-3 max-w-lg w-full pointer-events-auto">
            <Download className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Install GradeWise GH</p>
              <p className="text-xs text-primary-foreground/75">Add to your home screen for quick access</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="rounded-xl text-xs font-bold shrink-0 bg-white text-primary hover:bg-white/90"
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
