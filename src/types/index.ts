// Language types
export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
  ttsLang: string;
}

// Chat message types
export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  ts: number;
  id: number;
  isScenario?: boolean;
  scenarioColor?: string;
  scenarioIcon?: string;
}

// Feedback type
export interface Feedback {
  id: number;
  grammar?: string;
  vocab?: string;
  tip?: string;
  suggestedLevel?: string;
  userMsg: string;
  ts: string;
}

// Stats type
export interface Stats {
  messages: number;
  vocab: number;
  grammar: number;
  time: number;
}

// Journal entry type
export interface JournalEntry {
  id: number;
  date: string;
  summary: string;
  highlight: string;
}

// Goal type
export interface Goal {
  id: number;
  text: string;
  done: boolean;
}

// Conversation type
export interface Conversation {
  id: number;
  filename?: string;
  title: string;
  langCode: string;
  level: string;
  mode: string;
  messages: ChatMessage[];
  restorable: boolean;
  createdAt: number;
}

// Context types
export interface LanguageContextType {
  lang: Language;
  level: string;
  mode: "casual" | "structured";
  sessionStart: number;
  changeLanguage: (lang: Language) => void;
  changeLevel: (level: string) => void;
  changeMode: (mode: "casual" | "structured") => void;
}

export interface GoalsContextType {
  goals: Goal[];
  newGoal: string;
  setNewGoal: (goal: string) => void;
  editingGoal: number | null;
  setEditingGoal: (id: number | null) => void;
  addGoal: () => void;
  toggleGoal: (id: number) => void;
  deleteGoal: (id: number) => void;
  saveEditGoal: (id: number, text: string) => void;
}

export interface ChatContextType {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  input: string;
  setInput: (input: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  feedback: Feedback[];
  setFeedback: (feedback: Feedback[]) => void;
  stats: Stats;
  setStats: (stats: Stats) => void;
  journal: JournalEntry[];
  setJournal: (journal: JournalEntry[]) => void;
  addMessage: (msg: ChatMessage) => void;
  addFeedback: (fb: Feedback) => void;
  updateStats: (updates: Partial<Stats>) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  clearMessages: () => void;
  initializeWelcomeMessage: (msg: ChatMessage) => void;
}

export interface UIContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  toggleSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export interface ConversationContextType {
  convList: Conversation[];
  setConvList: (list: Conversation[]) => void;
  addConversation: (entry: Conversation) => void;
  loadConversationsFromFiles: (files: File[], parseConvFile: any) => void;
  deleteConversation: (id: number) => void;
  clearAllConversations: () => void;
}
