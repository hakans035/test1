import { Building2, Users2, Target, Rocket } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6">
                About AutomatePro
              </h1>
              <p className="text-lg text-muted-foreground">
                We're passionate about helping businesses leverage the power of automation and artificial intelligence to streamline their operations and achieve greater efficiency.
              </p>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1664575196412-ed801e8333a1"
                alt="Our team"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground">
                To empower businesses with cutting-edge automation solutions that drive growth and innovation while reducing operational complexity.
              </p>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Our Vision</h2>
              <p className="text-muted-foreground">
                To be the leading provider of intelligent automation solutions, helping organizations worldwide embrace digital transformation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary/5">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Clients Worldwide</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Countries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Our Leadership Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the experts behind our innovative automation solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-lg transition-all text-center">
                <div className="mb-4">
                  <img
                    src={`https://i.pravatar.cc/150?img=${i}`}
                    alt={`Team Member ${i}`}
                    className="w-32 h-32 rounded-full mx-auto"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1">John Doe</h3>
                <p className="text-sm text-muted-foreground mb-4">Chief Technology Officer</p>
                <p className="text-sm text-muted-foreground">
                  15+ years of experience in AI and automation technologies.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}