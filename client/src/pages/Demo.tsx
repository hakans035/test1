import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ChatbotConfig } from "@shared/schema";
import { auth, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Demo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotConfig | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  // Check authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  // Fetch available chatbots
  const { data: chatbots = [], isLoading: isLoadingChatbots } = useQuery<ChatbotConfig[]>({
    queryKey: ["/api/chatbots"],
    queryFn: async () => {
      const response = await fetch("/api/chatbots");
      if (!response.ok) throw new Error("Failed to fetch chatbots");
      return response.json();
    },
  });

  // Only show active chatbots
  const activeChatbots = chatbots.filter(chatbot => chatbot.active);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUpWithEmail(authEmail, authPassword);
        toast({ title: "Success", description: "Account created successfully" });
      } else {
        await signInWithEmail(authEmail, authPassword);
        toast({ title: "Success", description: "Logged in successfully" });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Authentication failed",
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !selectedChatbot || !isAuthenticated) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.concat(newMessage),
          chatbotId: selectedChatbot.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.choices[0].message.content },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">AI Chatbot Demo</h1>

      {/* Authentication Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isAuthenticated ? "Signed In" : "Authentication Required"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <Button 
              variant="outline" 
              onClick={() => auth.signOut()}
              className="w-full"
            >
              Sign Out
            </Button>
          ) : (
            <>
              <p className="mb-4 text-muted-foreground">
                Please sign in or create an account to use the chatbot.
              </p>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full">
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full"
                  >
                    {isSignUp
                      ? "Already have an account? Sign In"
                      : "Don't have an account? Sign Up"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Chatbot Interface - Only show if authenticated */}
      {isAuthenticated && (
        <>
          {/* Chatbot selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Chatbot</label>
            <Select
              value={selectedChatbot?.id?.toString()}
              onValueChange={(value) => {
                const chatbot = chatbots.find((c) => c.id === parseInt(value));
                setSelectedChatbot(chatbot || null);
                setMessages([]); // Clear messages when switching chatbots
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a chatbot to start" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingChatbots ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  </div>
                ) : activeChatbots.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    No active chatbots available
                  </div>
                ) : (
                  activeChatbots.map((chatbot) => (
                    <SelectItem key={chatbot.id} value={chatbot.id.toString()}>
                      {chatbot.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedChatbot
                    ? "Type your message..."
                    : "Please select a chatbot first"}
                  disabled={loading || !selectedChatbot}
                />
                <Button type="submit" disabled={loading || !selectedChatbot}>
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedChatbot && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Currently chatting with: <span className="font-medium">{selectedChatbot.name}</span></p>
              {selectedChatbot.description && (
                <p className="mt-1">{selectedChatbot.description}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}