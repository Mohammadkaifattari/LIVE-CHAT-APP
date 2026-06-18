"use client";

import { createContext, useContext, useState } from "react";

const SidebarContext = createContext<{
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}>({ drawerOpen: false, setDrawerOpen: () => {} });

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);