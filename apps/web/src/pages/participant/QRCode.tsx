import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { QRCard } from "@/components/compsphere/QRCard";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { AlertCircle, QrCode } from "lucide-react";

export function QRCode() {
  const { user } = useAuth();

  const { data: myTeam, isLoading: isTeamLoading } = useQuery<any>({
    queryKey: ["my-team"],
    queryFn: () => api.get("/api/teams/my-team"),
  });

  const { data: tokenData, isLoading: isTokenLoading } = useQuery<any>({
    queryKey: ["qr-token"],
    queryFn: () => api.get("/api/qr/my-token"),
  });

  if (isTeamLoading || isTokenLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!myTeam) return null;
  const { team } = myTeam;

  const isEligible = ["VERIFIED", "SUBMITTED", "JUDGED"].includes(team.status);

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-text-primary">Attendance Pass</h1>
        <p className="text-xs text-text-secondary mt-1">
          Access your timing-safe event entry QR code.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {isEligible && tokenData?.token ? (
            <QRCard
              token={tokenData.token}
              participantName={user?.fullName || "Participant"}
              teamName={team.teamName}
              teamCode={team.teamCode}
              className="max-w-md mx-auto"
            />
          ) : (
            <GlassPanel className="text-center p-12 max-w-md mx-auto space-y-4">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
              <h3 className="text-lg font-bold text-text-primary">QR Code Unavailable</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your team status is not confirmed. QR codes are generated only for verified and confirmed team members. Confirm your slot to secure entry passes.
              </p>
            </GlassPanel>
          )}
        </div>

        {/* Info */}
        <GlassPanel className="space-y-6">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <QrCode className="w-4 h-4 text-brand-primary" />
            <span>Usage Instructions</span>
          </h3>

          <ul className="space-y-4 text-xs text-text-secondary leading-relaxed">
            <li>
              <strong>Event Entry check-in:</strong> Scan your QR code at the reception desk upon arriving at Day 1 and Day 2 of the venue.
            </li>
            <li>
              <strong>Catering Log:</strong> Present your QR code to claim lunch tokens and venue logistics facilities.
            </li>
            <li>
              <strong>Timing-safe security:</strong> Codes expire periodically. Avoid printing offline copies long before the event; downloading or opening the page live is highly recommended.
            </li>
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
}
