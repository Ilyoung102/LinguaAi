import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AIModels, APIKeys, SettingsContextType } from "../types";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [aiProvider, setAiProvider] = useState<string>(() => {
        try { return localStorage.getItem("lingua_provider") || "claude"; } catch { return "claude"; }
    });

    const [aiModels, setAiModels] = useState<AIModels>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("lingua_models") || "{}");
            return {
                claude: saved.claude || "claude-3-7-sonnet-20250219",
                openai: saved.openai || "gpt-4o",
                gemini: saved.gemini || "gemini-2.5-flash",
            };
        } catch { return { claude: "claude-3-7-sonnet-20250219", openai: "gpt-4o", gemini: "gemini-2.5-flash" }; }
    });

    const [apiKeys, setApiKeys] = useState<APIKeys>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("lingua_keys") || "{}");
            return { claude: saved.claude || "", openai: saved.openai || "", gemini: saved.gemini || "" };
        } catch { return { claude: "", openai: "", gemini: "" }; }
    });

    useEffect(() => {
        try { localStorage.setItem("lingua_provider", aiProvider); } catch { }
    }, [aiProvider]);

    useEffect(() => {
        try { localStorage.setItem("lingua_models", JSON.stringify(aiModels)); } catch { }
    }, [aiModels]);

    useEffect(() => {
        try { localStorage.setItem("lingua_keys", JSON.stringify(apiKeys)); } catch { }
    }, [apiKeys]);

    const value: SettingsContextType = {
        aiProvider, setAiProvider,
        aiModels, setAiModels,
        apiKeys, setApiKeys
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within SettingsProvider");
    }
    return context;
}
