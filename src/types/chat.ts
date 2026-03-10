export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
