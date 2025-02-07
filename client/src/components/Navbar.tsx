import { Link } from "wouter";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { auth, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type AuthFormData = z.infer<typeof authSchema>;

const AuthDialog = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isSignUp) {
        await signUpWithEmail(data.email, data.password);
        toast({ title: "Success", description: "Account created successfully" });
      } else {
        await signInWithEmail(data.email, data.password);
        toast({ title: "Success", description: "Logged in successfully" });
      }
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Authentication failed",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
            <CardDescription>
              {isSignUp ? "Sign up to get started" : "Sign in to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete={isSignUp ? "new-password" : "current-password"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Loading..."
                      : isSignUp
                      ? "Sign Up"
                      : "Sign In"}
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
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/workflows", label: "Workflows" },
    { href: "/demo", label: "Demo" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/">
            <a className="mr-6 flex items-center space-x-2">
              <img 
                src="https://www.dropbox.com/scl/fi/5mjwvpqft6y5nwojpx9a2/logo.png?rlkey=qqjzlcqvvwcn3x3jk1xxwu35n&raw=1"
                alt="AutomatePro"
                className="h-8 w-auto"
              />
            </a>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="transition-colors hover:text-foreground/80">
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
        <Button
          className="inline-flex items-center justify-center md:hidden"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {!user ? (
            <Button variant="outline" onClick={() => setIsAuthDialogOpen(true)}>
              Sign In
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline">Admin</Button>
                </Link>
              )}
              <Button variant="outline" onClick={() => auth.signOut()}>
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-b md:hidden">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className="text-sm font-medium transition-colors hover:text-foreground/80">
                    {link.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <AuthDialog isOpen={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </nav>
  );
}