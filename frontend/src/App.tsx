import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "./services/api";

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

// Feature card component for the bento grid (Tailwind)
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
  const sizeClasses =
    size === "large"
      ? "col-span-12 md:col-span-6"
      : "col-span-12 sm:col-span-6 md:col-span-3";

  return (
    <div
      className={`rounded-2xl border border-neutral-800 bg-neutral-900 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-500 ${sizeClasses}`}
    >
      <div className="w-12 h-12 mb-5 text-white [&>svg]:w-12 [&>svg]:h-12">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold mb-4 text-white">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-base">
        {description}
      </p>
    </div>
  );
};

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  useEffect(() => {
    let mounted = true;
    apiClient
      .getProfile()
      .then(() => {
        if (!mounted) return;
        setIsAuthed(true);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthed(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
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
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-8 pt-8 pb-4 min-h-[70vh] bg-black">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold mb-6 tracking-tight leading-tight">
            Cron Jobs, <span className="text-neutral-400">Simplified</span>
          </h1>
          <p className="text-xl text-neutral-400 mb-5 max-w-2xl mx-auto leading-relaxed">
            A developer-focused dashboard that lets you schedule, manage, and
            monitor cron jobs that hit specific endpoints automatically. Secure,
            reliable, and built for the modern web.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href={isAuthed ? "/dashboard" : "/auth"}
              className="rounded-xl border border-transparent px-6 py-4 text-sm font-semibold bg-white text-black shadow transition hover:bg-neutral-200"
            >
              Get Started
            </a>
            <button className="rounded-xl border border-neutral-800 px-6 py-4 text-sm font-medium bg-transparent text-white transition hover:bg-neutral-900">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 px-8 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to manage cron jobs
            </h2>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              Powerful features designed for developers who value simplicity and
              reliability
            </p>
          </div>

          <div className="grid grid-cols-12 gap-5">
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
      <footer className="bg-neutral-900 border-t border-neutral-800 p-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-neutral-500 text-sm">
            Built with React, Go, and modern cloud infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
