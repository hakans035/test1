import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const faqs = [
  {
    question: "What is automation and how can it help my business?",
    answer:
      "Automation involves using technology to perform tasks with minimal human intervention. It can help your business save time, reduce errors, cut costs, and improve efficiency by streamlining repetitive processes.",
  },
  {
    question: "Which automation tools do you recommend?",
    answer:
      "We work with various tools including Zapier, Power Automate, Make.com, and n8n.io. The best tool depends on your specific needs, integration requirements, and technical expertise.",
  },
  {
    question: "How long does it take to implement automation solutions?",
    answer:
      "Implementation time varies based on complexity. Simple automations can be set up in hours, while complex workflows might take weeks to properly design and implement.",
  },
  {
    question: "Do I need technical knowledge to use automation tools?",
    answer:
      "Many modern automation tools offer no-code solutions that don't require programming knowledge. However, we provide training and support to help you get the most out of these tools.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer comprehensive support including initial consultation, implementation, training, and ongoing technical assistance. Our team is available 24/7 to help with any issues.",
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about our automation solutions.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-6">
                Still have questions? We're here to help.
              </p>
              <Link href="/contact">
                <Button size="lg">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}