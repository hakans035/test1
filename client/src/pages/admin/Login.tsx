import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithEmail, isUserAdmin } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // First attempt to sign in
      await signInWithEmail(email, password);

      // Then check if the user is an admin
      const isAdmin = await isUserAdmin();
      console.log('Admin check result:', isAdmin);

      if (!isAdmin) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have administrator privileges. Please contact your system administrator.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Welcome to the admin dashboard",
      });
      setLocation("/admin/dashboard");
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to sign in. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Check if already logged in as admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const admin = await isUserAdmin();
        if (admin) {
          setLocation("/admin/dashboard");
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setCheckingAdmin(false);
      }
    };
    checkAdminStatus();
  }, [setLocation]);

  if (checkingAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="text-center">Checking authentication status...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}