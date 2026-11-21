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
    // Responsive size: clamp between 200px (small mobile) and 280px
    const size = Math.min(280, Math.max(200, window.innerWidth - 120));
    QRCode.toCanvas(
      canvasRef.current,
      token,
      {
        width: size,
        margin: 2,
        color: {
          dark: "#020807",
          light: "#F4FFFC",
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
      <div className="flex items-center gap-2 mb-5">
        <QrCode className="w-5 h-5 text-brand-primary" />
        <h3 className="font-bold text-base sm:text-lg text-text-primary">Attendance QR Code</h3>
      </div>

      <div className="flex flex-col items-center">
        {token ? (
          <div className="bg-[#F4FFFC] p-3 rounded-lg shadow-brand-glow-sm w-fit mx-auto">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        ) : (
          <div className="w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] bg-bg-surface border border-dashed border-border rounded-lg flex items-center justify-center text-xs text-text-muted">
            QR loading...
          </div>
        )}

        <div className="text-center mt-5">
          <p className="font-bold text-text-primary text-sm">{participantName}</p>
          <p className="text-xs text-text-secondary mt-1">
            {teamName} ({teamCode})
          </p>
        </div>

        {token && (
          <NeonButton onClick={handleDownload} variant="secondary" size="sm" className="mt-5 w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </NeonButton>
        )}
      </div>
    </GlassPanel>
  );
}
