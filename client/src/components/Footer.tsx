import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <img 
              src="https://www.dropbox.com/scl/fi/5mjwvpqft6y5nwojpx9a2/logo.png?rlkey=qqjzlcqvvwcn3x3jk1xxwu35n&raw=1"
              alt="AutomatePro"
              className="h-8 w-auto"
            />
            <p className="text-sm text-muted-foreground">
              Empowering businesses with intelligent automation solutions to drive growth and innovation.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-sm text-muted-foreground hover:text-foreground">
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/workflows">
                  <a className="text-sm text-muted-foreground hover:text-foreground">
                    Workflows
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/demo">
                  <a className="text-sm text-muted-foreground hover:text-foreground">
                    Request Demo
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-sm text-muted-foreground hover:text-foreground">
                    FAQ
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-sm text-muted-foreground hover:text-foreground">
                    Contact
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                contact@automatepro.com
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                <span>
                  123 Innovation Drive<br />
                  Tech City, TC 12345
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter for updates and insights.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} AutomatePro. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy">
                <a className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
              </Link>
              <Link href="/terms">
                <a className="text-sm text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}