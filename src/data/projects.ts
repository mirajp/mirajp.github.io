export interface Project {
  title: string;
  org: string;
  description: string;
  impact: string;
  tech: string[];
  featured?: boolean;
}

export const projects: Project[] = [
  {
    title: "Google Ads and Partners Rewards",
    org: "Google",
    description:
      "Architected and launched a rewards platform using Angular islands, gRPC APIs, Django task-based services, Firestore, and BigQuery. Pioneered a new hybrid rendering strategy for Marketing programs to deliver low latency web experiences, optimized content management and internationalization, and personalized AB testing.",
    impact:
      "Scaled to 500K+ advertisers and agencies globally, and incentivized $X00M+ in ad spend.",
    tech: [
      "Angular",
      "Django",
      "App Engine",
      "gRPC",
      "Firestore",
      "BigQuery",
      "OAuth",
    ],
    featured: true,
  },
  {
    title: "Web Component Design System",
    org: "Google",
    description:
      "Developed a TypeScript-based Web Component UI library and a hybrid SSG/SSR rendering architecture for business.google.com and ads.google.com Marketing pages, including server rendering of personalized content.",
    impact:
      "Became the design system foundation used across multiple product surfaces.",
    tech: [
      "TypeScript",
      "Lit",
      "Web Components",
      "Hybrid SSR/SSG",
      "Design Systems",
    ],
  },
  {
    title: "Payments Buyflow",
    org: "Google",
    description:
      "Built next-generation UX components and server-driven UI schemas for Google Payments buy flows across 1P products like YouTube, Google Ads, Google Store, Google TV, and Stadia. Shipped dark mode and new payment methods (PayPal, Klarna).",
    impact: "Served 100M+ users with 95%+ critical-journey test coverage.",
    tech: [
      "Server-Driven UI",
      "Accessibility",
      "Server Side Rendering",
      "gRPC",
    ],
  },
  {
    title: "Microsoft Partner Connect and Devices Resellers Platform",
    org: "Microsoft",
    description:
      "Launched Microsoft Partner Connect and Devices Resellers storefronts used by Microsoft partners around the world to order devices and parts, and manage warranties and returns.",
    impact:
      "Enabled successful launch of the newest Surface line, and consolidation of partner-related tooling for $XM+ in operational savings.",
    tech: [
      "Express",
      "React",
      "Fluent Design",
      "Azure App Insights",
      "a11y",
      "l10n",
    ],
    featured: true,
  },
  {
    title: "Azure Partner Testing Platform",
    org: "Microsoft",
    description:
      "Helped build an end-to-end testing platform for commercial and partner Azure reseller scenarios: C# APIs, TypeScript/React frontends, OpenAPI/JSON-Schema-driven dynamic forms, and CI/CD pipelines in Azure DevOps.",
    impact:
      "Full build-and-deploy matrix completing in under 10 minutes. 100s of real end-to-end scenarios enabled and testable.",
    tech: ["C#", "React", "Fluent Design", "OpenAPI", "Azure DevOps", "CI/CD"],
  },
  {
    title: "Real-Time Trade Processing System",
    org: "Highbridge Capital Management",
    description:
      "Architected real-time trade processing and reporting systems to meet MiFID II compliance requirements. Deployed producers and consumers across Windows and Linux VMs to meet fault-tolerance and disaster-recovery requirements.",
    impact:
      "Cut audit-related backup runtimes by over 60% via ETL and stored-procedure optimization. Enabled reporting of 10K+ fills across multiple orders in under a minute.",
    tech: [
      "Kafka",
      "Java",
      "Spring Boot",
      "Angular",
      "Vue",
      "WebSockets",
      "SQL Server",
    ],
    featured: true,
  },
];
