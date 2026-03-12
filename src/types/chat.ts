export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolResults?: IToolResult[];
}

export interface IToolResult {
  tool: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
