/**
 * LandingPage — marketing page shown to first-time visitors (no vault set up).
 * Communicates Journly.ai as a privacy-first AI thinking system for busy professionals.
 */

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    title: 'Local Encryption (AES-256-GCM)',
    description:
      'Your thoughts are encrypted on-device with AES-256-GCM before they touch storage. Keys derive from your passphrase via PBKDF2 and never persist.',
  },
  {
    title: 'Works Offline',
    description:
      'No cloud. No sync. No dependency on someone else\'s server staying online. Your data lives on your device, period.',
  },
  {
    title: 'Optional Local AI',
    description:
      'AI runs on-device via WebLLM. No API calls, no data leaving your machine. Or connect your own OpenAI-compatible endpoint.',
  },
  {
    title: 'Story Builder',
    description:
      'Converts scattered thoughts into structured narratives. Useful for processing complex decisions, writing memos, or untangling problems.',
  },
  {
    title: 'Voice Capture',
    description:
      'Speak your thoughts. Transcription runs locally. Faster than typing when your brain is moving faster than your fingers.',
  },
  {
    title: 'Zero Pressure',
    description:
      'No streaks. No reminders. No guilt mechanics. Open it when you need to think. Close it when you\'re done.',
  },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl">
          A thinking tool,{' '}
          <span className="text-primary">not a journal.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Clear mental clutter. Structure messy thoughts. Generate insights.
          No streaks, no guilt, no discipline required.
        </p>
        <button
          onClick={onGetStarted}
          className="mt-10 bg-primary hover:bg-primary-hover text-white rounded-lg px-8 py-4 text-lg font-medium transition-colors"
        >
          Get Started
        </button>
        <p className="mt-4 text-slate-500 text-sm">
          Free. Offline. No account required.
        </p>
      </section>

      {/* Problem */}
      <section className="px-6 py-24 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">
          Too many open tabs in your mind.
        </h2>
        <div className="space-y-6 text-slate-400 leading-relaxed">
          <p>
            You're an engineer, a founder, a manager. You hold dozens of
            threads in your head — architecture decisions, team dynamics,
            half-formed strategies, that bug you can't stop thinking about.
          </p>
          <p>
            Traditional journaling doesn't work for you. It's emotional,
            habit-driven, and designed for people who want to write about their
            feelings every morning. You don't need a diary. You need a place to
            dump, sort, and process the noise.
          </p>
          <p className="text-slate-200 font-medium">
            Journly is a structured thinking environment. Write when you need
            to think. Stop when you're done. That's it.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-12 text-center">
            Built for people who read the spec.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="border border-slate-800 rounded-xl p-6 bg-slate-900/50"
              >
                <h3 className="text-lg font-semibold text-slate-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Privacy */}
      <section className="px-6 py-24 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">
          We can't read your data. Nobody can.
        </h2>
        <div className="space-y-4 text-slate-400 leading-relaxed">
          <p>
            Encryption happens before storage, using the WebCrypto API built
            into your browser. AES-256-GCM with a unique IV per record.
            Key derivation via PBKDF2-SHA256 at 600,000 iterations.
          </p>
          <p>
            No accounts. No telemetry. No analytics. No cloud. Your passphrase
            never leaves your device. We don't have a server to send it to.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          <span className="border border-slate-800 rounded-full px-4 py-2">AES-256-GCM</span>
          <span className="border border-slate-800 rounded-full px-4 py-2">PBKDF2-SHA256</span>
          <span className="border border-slate-800 rounded-full px-4 py-2">WebCrypto API</span>
          <span className="border border-slate-800 rounded-full px-4 py-2">Zero Knowledge</span>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-6 py-24 text-center border-t border-slate-800">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Start thinking clearly.
        </h2>
        <p className="text-slate-400 mb-8">
          Set up your encrypted vault in under 30 seconds.
        </p>
        <button
          onClick={onGetStarted}
          className="bg-primary hover:bg-primary-hover text-white rounded-lg px-8 py-4 text-lg font-medium transition-colors"
        >
          Get Started
        </button>
      </section>
    </div>
  );
}
