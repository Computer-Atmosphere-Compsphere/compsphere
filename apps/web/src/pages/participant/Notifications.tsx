import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassPanel } from "@/components/compsphere/GlassPanel";
import { Bell, CheckCircle2 } from "lucide-react";

export function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<any[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
  });

  const readMutation = useMutation({
    mutationFn: () => api.post("/api/notifications/read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["session-user"] }); // updates navbar unread dots
    },
  });

  useEffect(() => {
    // Automatically mark all notifications as read when page is visited
    readMutation.mutate();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="pb-6 border-b border-border flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Notifications</h1>
          <p className="text-xs text-text-secondary mt-1">
            Stay updated with qualification reviews, submissions, and SLA notices.
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center text-brand-primary">
          <Bell className="w-5 h-5" />
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif, idx) => (
            <GlassPanel key={idx} className={notif.readAt ? "border-border/40" : "border-brand-dim"}>
              <div className="flex gap-4 items-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  notif.readAt ? "bg-bg-surface text-text-muted" : "bg-brand-dim text-brand-primary"
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-bold text-sm text-text-primary">{notif.title}</h4>
                    <span className="text-[10px] text-text-muted">
                      {new Date(notif.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{notif.message}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      ) : (
        <GlassPanel className="text-center p-12 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-brand-primary mx-auto" />
          <h3 className="text-lg font-bold text-text-primary">No Notifications</h3>
          <p className="text-xs text-text-secondary">You are all caught up!</p>
        </GlassPanel>
      )}
    </div>
  );
}
