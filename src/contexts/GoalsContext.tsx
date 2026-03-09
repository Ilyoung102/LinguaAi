import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { INITIAL_GOALS } from "../constants";
import { Goal, GoalsContextType } from "../types";

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

interface GoalsProviderProps {
  children: ReactNode;
}

export function GoalsProvider({ children }: GoalsProviderProps) {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [newGoal, setNewGoal] = useState<string>("");
  const [editingGoal, setEditingGoal] = useState<number | null>(null);

  const addGoal = useCallback(() => {
    if (!newGoal.trim()) return;
    setGoals((g) => [...g, { id: Date.now(), text: newGoal.trim(), done: false }]);
    setNewGoal("");
  }, [newGoal]);

  const toggleGoal = useCallback((id: number) => {
    setGoals((g) =>
      g.map((go) => (go.id === id ? { ...go, done: !go.done } : go))
    );
  }, []);

  const deleteGoal = useCallback((id: number) => {
    setGoals((g) => g.filter((go) => go.id !== id));
  }, []);

  const saveEditGoal = useCallback((id: number, text: string) => {
    setGoals((g) => g.map((go) => (go.id === id ? { ...go, text } : go)));
    setEditingGoal(null);
  }, []);

  const value: GoalsContextType = {
    goals,
    newGoal,
    setNewGoal,
    editingGoal,
    setEditingGoal,
    addGoal,
    toggleGoal,
    deleteGoal,
    saveEditGoal,
  };

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals(): GoalsContextType {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoals must be used within GoalsProvider");
  }
  return context;
}
