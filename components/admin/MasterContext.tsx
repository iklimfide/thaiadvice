"use client";

import { createContext, useContext } from "react";

type MasterContextValue = {
  isMaster: boolean;
};

const MasterContext = createContext<MasterContextValue>({ isMaster: false });

export function MasterProvider({
  isMaster,
  children,
}: {
  isMaster: boolean;
  children: React.ReactNode;
}) {
  return (
    <MasterContext.Provider value={{ isMaster }}>
      {children}
    </MasterContext.Provider>
  );
}

export function useMaster() {
  return useContext(MasterContext);
}
