import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { NeonButton } from "@/components/compsphere/NeonButton";
import { StatusBadge } from "@/components/compsphere/StatusBadge";
import { Sword, Lock, Unlock, AlertTriangle } from "lucide-react";

export function BattleRoyale() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-br-slots"],
    queryFn: () => api.get("/api/battle-royale/slots"),
    refetchInterval: 10_000,
  });

  const resetSlotMutation = useMutation({
    mutationFn: (slotId: string) => api.post("/api/admin/reset-br-slot", { slotId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-br-slots"] }),
  });

  const slots: any[] = data?.slots ?? [];
  const claimed = slots.filter((s) => s.claimedBy);
  const available = slots.filter((s) => !s.claimedBy);

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-border flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Battle Royale Control</h1>
          <p className="text-xs text-text-secondary mt-1">
            Monitor slot claims in real time. Reset stuck or incorrectly claimed slots.
          </p>
        </div>
        <div className="flex gap-6 text-center text-xs">
          <div>
            <p className="text-brand-primary font-mono font-bold text-2xl">{claimed.length}</p>
            <p className="text-text-muted">Claimed</p>
          </div>
          <div>
            <p className="text-yellow-400 font-mono font-bold text-2xl">{available.length}</p>
            <p className="text-text-muted">Available</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {slots.map((slot: any) => (
            <GlassPanel
              key={slot.id}
              className={`flex flex-col items-center gap-3 p-4 text-center ${
                slot.claimedBy ? "border-brand-primary/30 bg-brand-dim/10" : "border-border"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  slot.claimedBy ? "bg-brand-dim text-brand-primary" : "bg-bg-surface text-text-muted"
                }`}
              >
                {slot.claimedBy ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>

              <div className="space-y-0.5">
                <p className="font-mono font-bold text-xs text-text-primary">Slot {slot.slotNumber}</p>
                {slot.claimedBy ? (
                  <p className="text-[9px] text-text-muted truncate max-w-[80px]">{slot.teamCode || "Claimed"}</p>
                ) : (
                  <p className="text-[9px] text-text-muted">Available</p>
                )}
              </div>

              {slot.claimedBy && (
                <button
                  onClick={() => resetSlotMutation.mutate(slot.id)}
                  disabled={resetSlotMutation.isPending}
                  className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-0.5 transition"
                >
                  <AlertTriangle className="w-2.5 h-2.5" /> Reset
                </button>
              )}
            </GlassPanel>
          ))}
        </div>
      )}

      <GlassPanel className="text-xs text-text-muted leading-relaxed">
        <Sword className="w-4 h-4 text-brand-primary inline mr-1.5 mb-0.5" />
        Battle Royale slots are claimed atomically using <code className="font-mono text-brand-primary">SELECT FOR UPDATE SKIP LOCKED</code> to prevent double-booking under concurrent load. Each slot can only be claimed once; resetting releases it back into the available pool.
      </GlassPanel>
    </div>
  );
}
