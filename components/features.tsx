"use client";

import { Brain, FileText, Database, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { create } from "zustand";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

export const useFeaturesStore = create<{ features: Feature[] }>(() => ({
  features: [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description:
        "Advanced AI automatically extracts key concepts from your notes and creates targeted flashcards for optimal learning.",
    },
    {
      icon: FileText,
      title: "Multiple Input Formats",
      description:
        "Upload text, paste content directly, or upload PDF files. Cognify handles various content types seamlessly.",
    },
    {
      icon: Database,
      title: "Personal Study Database",
      description:
        "All your flashcards are stored securely in your personal database, accessible anytime for review and study sessions.",
    },
    {
      icon: Key,
      title: "Bring Your Own API",
      description:
        "Use your own AI API token for complete control and privacy. No subscription fees, just bring your preferred AI service.",
    },
  ],
}));

export function Features() {
  const { features } = useFeaturesStore();
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Powerful Features for Smarter Learning
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform your study materials into effective
            learning tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardContent className="flex flex-col items-center text-center p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
