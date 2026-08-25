import React, { useRef, useEffect } from "react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";

interface QRCardProps {
  token: string | null;
  participantName: string;
  teamName: string;
  teamCode: string;
  className?: string;
}

export function QRCard({
  token,
  participantName,
  teamName,
  teamCode,
  className,
}: QRCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!token || !canvasRef.current) return;
    
    QRCode.toCanvas(
      canvasRef.current,
      token,
      {
        width: 240,
        margin: 2,
        color: {
          dark: "#020807", // dark theme base
          light: "#F4FFFC", // luminous primary light text
        },
      },
      (err) => {
        if (err) console.error("Error generating QR:", err);
      }
    );
  }, [token]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `compsphere-qr-${teamCode}-${participantName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <GlassPanel className={className}>
      <div className="flex items-center gap-2 mb-6">
        <QrCode className="w-5 h-5 text-brand-primary" />
        <h3 className="font-bold text-lg text-text-primary">Attendance QR Code</h3>
      </div>

      <div className="flex flex-col items-center">
        {token ? (
          <div className="bg-[#F4FFFC] p-3 rounded-lg shadow-brand-glow-sm">
            <canvas ref={canvasRef} />
          </div>
        ) : (
          <div className="w-[240px] h-[240px] bg-bg-surface border border-dashed border-border rounded-lg flex items-center justify-center text-xs text-text-muted">
            QR loading...
          </div>
        )}

        <div className="text-center mt-6">
          <p className="font-bold text-text-primary">{participantName}</p>
          <p className="text-xs text-text-secondary mt-1">
            {teamName} ({teamCode})
          </p>
        </div>

        {token && (
          <NeonButton onClick={handleDownload} variant="secondary" size="sm" className="mt-6 w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </NeonButton>
        )}
      </div>
    </GlassPanel>
  );
}
