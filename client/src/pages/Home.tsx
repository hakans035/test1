import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <div className="container py-20 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col gap-6">
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Transform Your Business with AI-Powered Automation
              </h1>
              <p className="text-lg text-muted-foreground">
                Streamline your operations, reduce costs, and boost efficiency with our cutting-edge automation solutions powered by artificial intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/demo">
                  <Button size="lg" className="w-full sm:w-auto">
                    Try Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative lg:ml-auto">
              <div className="relative aspect-square w-full max-w-lg rounded-full bg-gradient-to-tr from-primary to-primary-foreground/10 opacity-20 blur-3xl">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-transparent"></div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1640622307911-ee5870412ab5"
                alt="AI Automation Dashboard"
                className="relative rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Why Choose AutomatePro?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of business automation with our comprehensive suite of AI-powered solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-lg transition-all">
              <div className="mb-4 text-primary">
                <Zap className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Solutions</h3>
              <p className="text-muted-foreground">
                Leverage state-of-the-art artificial intelligence to optimize your business processes and decision-making.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-lg transition-all">
              <div className="mb-4 text-primary">
                <Shield className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-muted-foreground">
                Rest easy with our enterprise-grade security measures protecting your data and operations.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-lg transition-all">
              <div className="mb-4 text-primary">
                <Clock className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">
                Get expert assistance whenever you need it with our round-the-clock support team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container">
          <div className="rounded-lg bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl">
                Join thousands of businesses already benefiting from our automation solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/demo">
                  <Button size="lg" variant="secondary">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}