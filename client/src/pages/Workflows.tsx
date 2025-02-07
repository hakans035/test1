import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Power, Share2, Code2 } from "lucide-react";

const tools = [
  {
    name: "Zapier",
    description:
      "Connect apps and automate workflows with easy-to-use integrations.",
    icon: Settings,
    image: "https://images.unsplash.com/photo-1542744094-24638eff58bb",
  },
  {
    name: "Power Automate",
    description: "Microsoft's powerful automation tool for business processes.",
    icon: Power,
    image: "https://images.unsplash.com/photo-1644352744450-a391b8ce158d",
  },
  {
    name: "IFTTT",
    description: "Simple yet effective automation for everyday tasks.",
    icon: Share2,
    image: "https://images.unsplash.com/photo-1648134859211-4a1b57575f4e",
  },
  {
    name: "n8n.io",
    description: "Open-source workflow automation tool with advanced features.",
    icon: Code2,
    image: "https://images.unsplash.com/photo-1574717024757-c1ec4d86ae82",
  },
];

export default function Workflows() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Automation Tools</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {tools.map((tool) => (
          <Card key={tool.name}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <tool.icon className="h-8 w-8" />
                <CardTitle>{tool.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <img
                src={tool.image}
                alt={tool.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <p className="text-gray-600">{tool.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}