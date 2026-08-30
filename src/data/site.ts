export const site = {
  name: "Miraj Patel",
  role: "Software Engineer & Technical Lead",
  location: "New York, NY",
  github: "https://github.com/mirajp",
  linkedin: "https://www.linkedin.com/in/mirajp",
  // Keep in sync with `site` in astro.config.mjs
  url: "https://mirajp.github.io",
  summary:
    "Hands-on, full stack engineer with 10+ years building software of shapes and sizes.",
  tagline: "I build systems and tools people like using.",
  footerTagline: "Hello, world.",
} as const;

export const nav = [
  { label: "About", href: "/about/" },
  { label: "Blog", href: "/blog/" },
  { label: "Photos", href: "/photos/" },
  { label: "Projects", href: "/projects/" },
  { label: "Resume", href: "/resume/" },
  { label: "Tools", href: "/tools/" },
] as const;
