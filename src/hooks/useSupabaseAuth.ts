import { AuthContext } from "@/contexts/AuthContext";
import { useContext } from "react";

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within an AuthProvider");
  }
  return context;
}
