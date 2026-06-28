"use client";

import { create } from "zustand";

interface AppStore {
  selectedEnvironmentId: string | null;
  sidebarTab: "collections" | "history";

  setSelectedEnvironment: (id: string | null) => void;
  setSidebarTab: (tab: "collections" | "history") => void;
}

export const useAppStore = create<AppStore>()((set) => ({
  selectedEnvironmentId: null,
  sidebarTab: "collections",

  setSelectedEnvironment: (id) => set({ selectedEnvironmentId: id }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
}));
