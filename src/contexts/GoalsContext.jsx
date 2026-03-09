import { createContext, useContext, useState, useCallback } from "react";
import { INITIAL_GOALS } from "../constants";

const GoalsContext = createContext();

export function GoalsProvider({ children }) {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [newGoal, setNewGoal] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);

  const addGoal = useCallback(() => {
    if (!newGoal.trim()) return;
    setGoals((g) => [...g, { id: Date.now(), text: newGoal.trim(), done: false }]);
    setNewGoal("");
  }, [newGoal]);

  const toggleGoal = useCallback((id) => {
    setGoals((g) =>
      g.map((go) => (go.id === id ? { ...go, done: !go.done } : go))
    );
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals((g) => g.filter((go) => go.id !== id));
  }, []);

  const saveEditGoal = useCallback((id, text) => {
    setGoals((g) => g.map((go) => (go.id === id ? { ...go, text } : go)));
    setEditingGoal(null);
  }, []);

  const value = {
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

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoals must be used within GoalsProvider");
  }
  return context;
}
