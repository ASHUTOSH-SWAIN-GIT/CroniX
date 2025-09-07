import "./App.css";
import type { ReactNode } from "react";

// Monochrome inline SVG icons
const IconClock = () => (
  <svg
    className="feature-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconShield = () => (
  <svg
    className="feature-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
    <path d="M9.5 12.5l2 2 3.5-3.5" />
  </svg>
);

const IconLink = () => (
  <svg
    className="feature-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
    <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 1 1-7-7l1-1" />
  </svg>
);

const IconChart = () => (
  <svg
    className="feature-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 19V5" />
    <path d="M10 19V9" />
    <path d="M16 19V3" />
    <path d="M22 19V13" />
  </svg>
);

const IconCloud = () => (
  <svg
    className="feature-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19h11.5z" />
  </svg>
);

const IconCode = () => (
  <svg
    className="feature-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M9 18l-6-6 6-6" />
    <path d="M15 6l6 6-6 6" />
  </svg>
);

// Feature card component for the bento grid
const FeatureCard = ({
  title,
  description,
  icon,
  size = "normal",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  size?: "normal" | "large";
}) => {
  return (
    <div className={`feature-card ${size}`}>
      {icon}
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

function App() {
  const features = [
    {
      title: "Schedule & Monitor",
      description:
        "Create, edit, and monitor cron jobs with an intuitive dashboard. Set custom schedules and track execution status in real-time.",
      icon: <IconClock />,
      size: "large" as const,
    },
    {
      title: "Secure Authentication",
      description:
        "Login securely with Clerk.dev authentication. Your jobs and data are private and protected.",
      icon: <IconShield />,
      size: "normal" as const,
    },
    {
      title: "Endpoint Management",
      description:
        "Configure jobs to hit any HTTP endpoint automatically. Perfect for webhooks, API calls, and automation.",
      icon: <IconLink />,
      size: "normal" as const,
    },
    {
      title: "Execution Logs",
      description:
        "Keep detailed logs of job executions in PostgreSQL. Debug issues and track performance metrics.",
      icon: <IconChart />,
      size: "normal" as const,
    },
    {
      title: "Cloud Ready",
      description:
        "Built for the cloud with Go backend on Render and React frontend on Vercel. Scalable and reliable.",
      icon: <IconCloud />,
      size: "large" as const,
    },
    {
      title: "Developer Focused",
      description:
        "Clean, minimal interface designed specifically for developers who need efficient job management.",
      icon: <IconCode />,
      size: "normal" as const,
    },
  ];

  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="tagline">
            Cron Jobs, <span className="accent">Simplified</span>
          </h1>
          <p className="hero-description">
            A developer-focused dashboard that lets you schedule, manage, and
            monitor cron jobs that hit specific endpoints automatically. Secure,
            reliable, and built for the modern web.
          </p>
          <div className="hero-actions">
            <button className="cta-button">Get Started</button>
            <button className="secondary-button">Learn More</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="section-header">
            <h2>Everything you need to manage cron jobs</h2>
            <p>
              Powerful features designed for developers who value simplicity and
              reliability
            </p>
          </div>

          <div className="bento-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                size={feature.size}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>Built with React, Go, and modern cloud infrastructure</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
