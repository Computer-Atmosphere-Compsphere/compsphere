import React, { useRef, useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { Camera, CheckCircle2, XCircle, QrCode } from "lucide-react";
import { BrowserQRCodeReader } from "@zxing/browser";

export function Attendance() {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const lastScannedToken = useRef<string>("");

  const logMutation = useMutation({
    mutationFn: (token: string) => api.post("/api/qr/scan", { token }),
    onSuccess: (data: any) => {
      setLastResult({
        success: true,
        message: `✓ Checked in: ${data.participant?.fullName ?? "Participant"} | ${data.participant?.teamName ?? ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
    onError: (err: any) => {
      setLastResult({ success: false, message: err.message || "Invalid or already scanned QR code." });
    },
  });

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, _err) => {
          if (result) {
            const token = result.getText();
            // Debounce: don't re-scan same token within 3s
            if (token && token !== lastScannedToken.current) {
              lastScannedToken.current = token;
              logMutation.mutate(token);
              setTimeout(() => {
                lastScannedToken.current = "";
              }, 3000);
            }
          }
        }
      );
      controlsRef.current = controls;
      setScanning(true);
    } catch {
      setLastResult({ success: false, message: "Camera access denied. Please allow camera permission." });
    }
  }, [logMutation]);

  const stopScanning = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => stopScanning();
  }, [stopScanning]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">QR Attendance Scanner</h1>
        <p className="text-xs text-text-secondary mt-1">
          Use your device camera to scan participant QR codes for event check-in.
        </p>
      </div>

      <GlassPanel className="space-y-6">
        {/* Camera Viewfinder */}
        <div className="relative w-full aspect-video rounded overflow-hidden bg-black border border-border">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scan frame overlay */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-brand-primary rounded-lg opacity-70 shadow-[0_0_24px_rgba(0,245,200,0.3)]" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-[10px] text-brand-primary font-mono bg-black/60 px-2 py-0.5 rounded">
                  SCANNING…
                </span>
              </div>
            </div>
          )}

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
              <QrCode className="w-12 h-12 opacity-30" />
              <p className="text-xs">Camera inactive</p>
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {lastResult && (
          <div
            className={`flex items-center gap-2 p-3 rounded border text-sm font-medium transition-all ${
              lastResult.success
                ? "bg-brand-dim border-brand-primary/20 text-brand-primary"
                : "bg-red-950/20 border-red-900/30 text-red-400"
            }`}
          >
            {lastResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{lastResult.message}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4">
          {!scanning ? (
            <NeonButton
              onClick={startScanning}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" /> Start Camera
            </NeonButton>
          ) : (
            <NeonButton
              onClick={stopScanning}
              variant="ghost"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Stop Camera
            </NeonButton>
          )}
        </div>

        <p className="text-[10px] text-text-muted text-center leading-relaxed">
          Point the camera at a participant's QR code. Each code can only be scanned once per attendance type.
          The scanner auto-debounces repeated reads within 3 seconds.
        </p>
      </GlassPanel>
    </div>
  );
}
