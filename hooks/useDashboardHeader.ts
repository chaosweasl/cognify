import { create } from "zustand";
import { useUserProfileStore } from "@/hooks/useUserProfile";

interface DashboardHeaderState {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export const useDashboardHeaderStore = create<DashboardHeaderState>((set) => ({
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
}));

export function useDashboardHeader() {
  const { userProfile } = useUserProfileStore();
  const { drawerOpen, setDrawerOpen } = useDashboardHeaderStore();
  return {
    user: {
      name: userProfile?.display_name || "User",
      avatar: userProfile?.avatar_url || "/assets/nopfp.png",
    },
    drawerOpen,
    setDrawerOpen,
  };
}
