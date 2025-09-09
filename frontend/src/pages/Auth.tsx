import { Link } from "react-router-dom";

export default function Auth() {
  const handleGoogleSignIn = () => {
    window.location.href = "/auth/google";
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left: Brand/Design section */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 border-r border-neutral-900 bg-neutral-950">
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <Link
              to="/"
              className="text-neutral-400 hover:text-white transition"
            >
              ← Back to home
            </Link>
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">CroniX</h1>
          <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
            Schedule, monitor, and log your cron jobs with a clean,
            developer-first dashboard. Reliable automation with a minimal
            interface.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-300">Secure by design</p>
              <p className="text-neutral-500 text-sm mt-2">
                Your jobs and logs are protected.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-300">Realtime insights</p>
              <p className="text-neutral-500 text-sm mt-2">
                Track executions live.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-300">Endpoint first</p>
              <p className="text-neutral-500 text-sm mt-2">Webhook friendly.</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-300">Cloud ready</p>
              <p className="text-neutral-500 text-sm mt-2">Scale with ease.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
          <p className="text-neutral-400 mb-8">
            Sign in to continue to your dashboard
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-3 transition flex items-center justify-center gap-3"
          >
            <span className="inline-block w-5 h-5" aria-hidden>
              {/* Minimal G icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path d="M21.5 12h-9" strokeWidth="2" />
                <path d="M12.5 12a5 5 0 1 1-1.47-3.53" strokeWidth="2" />
              </svg>
            </span>
            <span>Sign in with Google</span>
          </button>

          <p className="text-neutral-500 text-xs mt-6">
            By continuing, you agree to our Terms and acknowledge our Privacy
            Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
