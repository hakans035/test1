import { apiRequest } from "./queryClient";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function sendMessage(messages: Message[]): Promise<string> {
  const response = await apiRequest("POST", "/api/chat", {
    messages,
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    temperature: 0.7,
  });
  const data = (await response.json()) as ChatResponse;
  return data.choices[0].message.content;
}
