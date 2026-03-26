import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export function QrShareModal() {
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin : "https://gradewisegh.replit.app";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-full gap-2 text-xs font-semibold border-border/60 hover:bg-secondary"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-8 text-center shadow-2xl border-border/60">
          <DialogTitle className="font-display text-lg font-bold mb-1">Share GradeWise GH</DialogTitle>
          <p className="text-sm text-muted-foreground mb-6">Scan this QR code to open the app</p>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-border/30">
              <QRCodeSVG value={url} size={180} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground break-all font-mono bg-secondary/40 rounded-xl px-3 py-2">{url}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
