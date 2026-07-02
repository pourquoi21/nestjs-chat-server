interface User {
  id: number;
  nickname: string;
}

export interface ChatMessage {
  type: 'chat';
  id: number;
  content: string;
  created_at: string;
  user: User;
}

export interface SystemMessage {
  type: 'system';
  id: number;
  content: string;
}

export type MessageType = ChatMessage | SystemMessage;