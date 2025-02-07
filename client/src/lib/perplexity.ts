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
    model: "llama-3.1-sonar-small-128k-online",
    temperature: 0.2,
  });
  const data = (await response.json()) as ChatResponse;
  return data.choices[0].message.content;
}
