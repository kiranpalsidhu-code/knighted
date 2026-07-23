export interface SkillCategory {
  label: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: "Programming Languages",
    skills: [
      "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
      "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart",
      "Haskell", "Elixir", "Clojure", "Perl", "Lua", "Shell/Bash",
    ],
  },
  {
    label: "Web — Frontend",
    skills: [
      "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "SvelteKit",
      "HTML5", "CSS3", "Tailwind CSS", "SCSS/Sass", "Styled Components",
      "Redux", "Zustand", "React Query", "GraphQL", "REST APIs",
      "Webpack", "Vite", "Rollup", "Jest", "Vitest", "Cypress", "Playwright",
      "Storybook", "Figma", "Accessibility (WCAG)", "Web Performance",
    ],
  },
  {
    label: "Web — Backend",
    skills: [
      "Node.js", "Express", "Fastify", "NestJS", "Django", "Flask", "FastAPI",
      "Ruby on Rails", "Laravel", "Spring Boot", "ASP.NET Core", "Phoenix",
      "tRPC", "gRPC", "WebSockets", "Microservices", "Serverless", "REST API Design",
    ],
  },
  {
    label: "Cloud & DevOps",
    skills: [
      "AWS", "Google Cloud (GCP)", "Microsoft Azure", "Docker", "Kubernetes",
      "Terraform", "Ansible", "Helm", "CI/CD", "GitHub Actions", "GitLab CI",
      "Jenkins", "ArgoCD", "Linux", "Nginx", "Prometheus", "Grafana",
      "Datadog", "New Relic", "Cloudflare", "Vercel", "Heroku",
    ],
  },
  {
    label: "Databases",
    skills: [
      "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "DynamoDB",
      "Elasticsearch", "Cassandra", "CockroachDB", "Supabase", "Firebase",
      "Snowflake", "BigQuery", "Redshift", "SQL", "NoSQL", "ORMs (Prisma / Drizzle)",
    ],
  },
  {
    label: "Mobile",
    skills: [
      "React Native", "Flutter", "iOS (Swift)", "Android (Kotlin)",
      "SwiftUI", "Jetpack Compose", "Expo", "Xcode", "Android Studio",
      "App Store Deployment", "Push Notifications",
    ],
  },
  {
    label: "Data & Machine Learning",
    skills: [
      "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
      "TensorFlow", "PyTorch", "scikit-learn", "Keras", "Hugging Face",
      "Pandas", "NumPy", "Matplotlib", "Seaborn",
      "Apache Spark", "Hadoop", "dbt", "Airflow",
      "Power BI", "Tableau", "Looker", "A/B Testing", "Statistics",
    ],
  },
  {
    label: "AI & LLMs",
    skills: [
      "OpenAI API", "LangChain", "LlamaIndex", "RAG (Retrieval-Augmented Generation)",
      "Prompt Engineering", "Fine-tuning", "Embeddings", "Vector Databases",
      "Pinecone", "Weaviate", "ChromaDB",
    ],
  },
  {
    label: "Security",
    skills: [
      "Cybersecurity", "Penetration Testing", "OWASP", "SOC 2",
      "OAuth 2.0", "JWT", "Encryption", "IAM", "Zero Trust",
      "Vulnerability Assessment", "SIEM", "Network Security",
    ],
  },
  {
    label: "Product & Design",
    skills: [
      "Product Management", "Product Strategy", "Roadmapping", "User Research",
      "UX Design", "UI Design", "Figma", "Wireframing", "Prototyping",
      "Design Systems", "User Testing", "Analytics", "Mixpanel", "Amplitude",
    ],
  },
  {
    label: "Project & Process",
    skills: [
      "Agile", "Scrum", "Kanban", "JIRA", "Confluence", "Notion",
      "Technical Leadership", "Mentoring", "Code Review",
      "System Design", "Architecture", "Documentation", "Stakeholder Management",
    ],
  },
  {
    label: "Soft Skills",
    skills: [
      "Leadership", "Communication", "Problem Solving", "Critical Thinking",
      "Collaboration", "Adaptability", "Time Management", "Presentation Skills",
      "Cross-functional Collaboration", "Remote Work", "Hiring & Interviewing",
    ],
  },
];

export const ALL_SKILLS: string[] = SKILL_CATEGORIES.flatMap((c) => c.skills);
