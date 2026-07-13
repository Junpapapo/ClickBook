export interface ChatMessage {
  id: string;
  sender: "user" | "buddy";
  text: string;
  timestamp: number;
}

export interface ChatState {
  messages: ChatMessage[];
  chatInputCache: string;
  isGenerating: boolean;
  pendingAutoSend?: boolean;
}
