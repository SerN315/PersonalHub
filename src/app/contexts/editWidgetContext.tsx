// context/EditModeContext.tsx
"use client";
import React, { createContext, useState, useContext } from "react";

const EditModeContext = createContext<{
  editMode: boolean;
  setEditMode: (val: boolean) => void;
}>({ editMode: false, setEditMode: () => {} });

export const EditModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [editMode, setEditMode] = useState(false);
  return (
    <EditModeContext.Provider value={{ editMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);
