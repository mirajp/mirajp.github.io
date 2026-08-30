export interface ExperienceEntry {
  company: string;
  title: string;
  team?: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export const experience: ExperienceEntry[] = [
  {
    company: "Google",
    title: "Senior UX Engineer, Tech Lead",
    team: "Ads Marketing",
    location: "New York, NY",
    start: "Jul 2021",
    end: "Present",
    bullets: [
      "Served as technical lead for Google's Ads Marketing MarTech team, setting architecture direction and technical standards for a shared design system and component library. Defined frontend infrastructure, TypeScript, and code quality standards adopted across multiple product teams.",
      "Architected a TypeScript-based Web Component UI library and hybrid SSG/SSR rendering architecture for business.google.com, including server rendering of personalized content. This became the design system foundation used across multiple product surfaces.",
      "Implemented an islands architecture frontend on CMS-built static sites for fast, interactive UI/UX. Partnered closely with localization and internationalization teams to build content workflows that scaled across markets.",
      "Led major initiatives end-to-end across ads.google.com and business.google.com, from scoping and architecture through partner coordination and GA launch. Delivered acquisition, retention, and incentive-personalization experiences that generated multi-million-dollar YoY revenue uplift and 5%+ growth in new advertiser acquisitions.",
      "Owned multiple zero-to-one initiatives from early Figma concepts through production launch across multiple locales, coordinating with localization and i18n teams to ship AI and experimentation features on multi-month timelines.",
      "Launched LLM-powered advertiser workflows for support, personalization, and recommendations. Reduced support cost globally, and increased sign ups for various Google business products.",
      "Built internal AI tooling that the team came to rely on: codified frontend and experimentation best practices into structured rules, context documents, and skill files consumed by an AI coding agent for automated code review and code generation. Measurably improved output quality and developer productivity.",
      "Partnered directly with marketing, Ads engineering, and platform teams as technical owner for shared infrastructure, including incrementality testing, personalization microservices, and audience segmentation. Improved experimentation velocity and helped marketers grow their experimentation roadmap 10x in a calendar year.",
      "Launched Google Ads Rewards to 500K+ US users: architected a new Angular-based dashboard site on business.google.com, and a Django-based storefront on App Engine connected to gRPC microservices, GCP OAuth, and Firestore and BigQuery databases.",
      "Mentored engineers at all levels through design reviews, code reviews, and career development.",
    ],
  },
  {
    company: "Google",
    title: "Software Engineer",
    team: "Payments",
    location: "Sunnyvale, CA",
    start: "May 2020",
    end: "Jul 2021",
    bullets: [
      "Built next-generation UX components and server-driven UI schemas for Google Payments buy flows across YouTube, Google Ads, Google Store, Google TV, and embedded platforms, serving 100M+ users.",
      "Maintained 95%+ coverage of critical user journeys using screenshot tests, Jasmine/Karma unit tests, and Selenium end-to-end tests backed by gRPC recordings.",
      "Integrated launch telemetry and A/B testing analytics to validate UX changes and ensure no negative revenue impact during large-scale rollouts.",
      "Delivered high-impact features including dark mode and new payment methods (PayPal, Klarna), improving conversion rates and accessibility across first-party surfaces.",
    ],
  },
  {
    company: "Microsoft",
    title: "Software Engineer",
    team: "Azure",
    location: "Redmond, WA",
    start: "Jun 2018",
    end: "Apr 2020",
    bullets: [
      "Modernized legacy internal tools into React SPAs using Fluent Design System, significantly improving maintainability, accessibility, and developer velocity.",
      "Implemented Azure Application Insights telemetry pipelines to analyze user workflows and accelerate incident diagnosis.",
      "Worked with various teams across Azure to implement an end-to-end testing platform for commercial and partner Azure reseller scenarios, built on C# APIs, TypeScript and React frontends, OpenAPI/JSON-Schema-driven dynamic forms, and a multitude of automated test suites and runners.",
      "Built and optimized CI/CD pipelines in Azure DevOps enabling UAT and multi-environment releases allowing for a large matrix of test setups, all building and deploying in under 10 minutes.",
    ],
  },
  {
    company: "Highbridge Capital Management",
    title: "Software Engineer",
    location: "New York, NY",
    start: "May 2017",
    end: "May 2018",
    bullets: [
      "Architected real-time trade processing and reporting systems using Kafka and Java microservices to meet MiFID II compliance, fault-tolerance, and disaster-recovery requirements.",
      "Built event-driven Angular and Vue applications with web sockets for traders, analysts, and executives, improving usability of mission-critical financial workflows.",
      "Developed Spring Boot REST APIs (OpenAPI-compliant) to reduce manual trade reconciliation and end-of-day processing time.",
      "Optimized ETL pipelines and database stored procedures, reducing audit-related backup runtimes by over 60%.",
    ],
  },
];

export interface EducationEntry {
  school: string;
  degree: string;
  location: string;
}

export const education: EducationEntry[] = [
  {
    school: "Cooper Union",
    degree: "Master of Engineering, Electrical Engineering",
    location: "New York, NY",
  },
  {
    school: "Cooper Union",
    degree: "Bachelor of Engineering, Computer Engineering",
    location: "New York, NY",
  },
];

export interface SkillGroup {
  category: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    category: "AI & LLM",
    items: [
      "Context Engineering",
      "Rules and Evals for AI Agent Workflows",
      "Skills and Developer Productivity Enhancements",
    ],
  },
  {
    category: "Languages & Frameworks",
    items: [
      "TypeScript",
      "JavaScript",
      "React",
      "Web Components",
      "Vue",
      "Angular",
      "Node.js",
      "Express",
      "Java",
      "Spring Boot",
      "Python",
      "Django",
    ],
  },
  {
    category: "Frontend Systems",
    items: [
      "Design Systems",
      "Accessibility (WCAG)",
      "Performance Optimization",
      "Hybrid SSR/SSG Architectures",
      "SEO",
    ],
  },
  {
    category: "Experimentation & Analytics",
    items: [
      "A/B Testing",
      "Audience Segmentation",
      "Personalization",
      "Google Analytics for Marketing",
      "Error and Performance Telemetry",
    ],
  },
  {
    category: "Backend & Infrastructure",
    items: [
      "gRPC and REST APIs",
      "Microservice Architectures",
      "SQL and NoSQL",
      "OAuth",
      "Google Cloud Platform (GCP)",
      "Microsoft Azure",
      "CI/CD Pipelines",
    ],
  },
  {
    category: "Leadership",
    items: [
      "Technical Lead",
      "Cross-functional Delivery",
      "People Mentorship",
      "Design & Code Review",
      "Roadmap Prioritization",
    ],
  },
];

export const headlineMetrics = [
  { value: "10+", label: "Years in industry" },
  { value: "70K+", label: "Devs reached on StackOverflow" },
  { value: "100M+", label: "Users impacted" },
  { value: "∞", label: "Tabs opened" },
] as const;
