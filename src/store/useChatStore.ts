import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  isSpeaking: boolean;
  isThinking: boolean;
  audioVolume: number;
  apiKey: string;
  apiBaseUrl: string;
  apiModel: string;
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  setSpeaking: (val: boolean) => void;
  setThinking: (val: boolean) => void;
  setAudioVolume: (val: number) => void;
  setApiKey: (key: string) => void;
  setApiBaseUrl: (url: string) => void;
  setApiModel: (model: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isSpeaking: false,
  isThinking: false,
  audioVolume: 0,
  apiKey: 'sk-cp-ua0blKdQvPQUwjE5BEiFqdXceRAHZCysJiMaCfQzztSRk7hNTQ4spArcqDHgZ7LtiT871vQSs6NmIO-kC8WfGcFz-wF3krcVzNlawAAkzkGY9iP6klFMbds',
  apiBaseUrl: '/api-proxy',
  apiModel: 'MiniMax-M2.7',
  
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Date.now().toString() }]
  })),
  
  setSpeaking: (val) => set({ isSpeaking: val }),
  setThinking: (val) => set({ isThinking: val }),
  
  setAudioVolume: (val) => set({ audioVolume: val }),
  
  setApiKey: (key) => {
    localStorage.setItem('morty_api_key', key);
    set({ apiKey: key });
  },

  setApiBaseUrl: (url) => {
    localStorage.setItem('morty_api_base_url', url);
    set({ apiBaseUrl: url });
  },

  setApiModel: (model) => {
    localStorage.setItem('morty_api_model', model);
    set({ apiModel: model });
  },
  
  clearMessages: () => set({ messages: [] })
}));
