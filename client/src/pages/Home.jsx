import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const features = [
  {
    title: 'Document Upload',
    description:
      'Upload PDFs, notes, and study materials. We extract and index the content so you can query it instantly.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ),
  },
  {
    title: 'RAG-Powered Q&A',
    description:
      'Ask questions about your documents and get accurate, context-aware answers powered by retrieval-augmented generation.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Smart Quiz Generator',
    description:
      'Generate contextual quizzes from your study materials with MCQ, short answer, and true/false questions. Get instant grading with detailed feedback.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Email Generator',
    description:
      'Generate polished emails in formal, friendly, or professional tones using your study context and AI.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Gmail Integration',
    description:
      'Connect your Gmail account via OAuth and send AI-generated emails directly from the app with one click.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

const steps = [
  { number: '1', title: 'Upload', description: 'Upload your study materials — PDFs, notes, or documents.' },
  { number: '2', title: 'Learn & Test', description: 'Ask questions, generate quizzes, and test your knowledge with AI-powered grading.' },
  { number: '3', title: 'Generate & Send', description: 'Create polished emails from context and send them via Gmail.' },
];

function Navbar({ user }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">
          StudentAI
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
            How it Works
          </a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero({ user }) {
  return (
    <section className="bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Your AI-Powered{' '}
          <span className="text-indigo-600">Study Assistant</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Upload study materials, ask questions with RAG-powered Q&A, generate intelligent quizzes,
          create polished emails, and send them directly through Gmail — all in one place.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-indigo-600 text-white font-medium px-8 py-3 rounded-md hover:bg-indigo-700 transition-colors text-base"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-indigo-600 text-white font-medium px-8 py-3 rounded-md hover:bg-indigo-700 transition-colors text-base"
              >
                Get Started — It's Free
              </Link>
              <a
                href="#features"
                className="border border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-md hover:bg-gray-50 transition-colors text-base"
              >
                Learn More
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-gray-50 py-20 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">
            Everything you need to study smarter
          </h2>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            StudentAI combines document intelligence, conversational AI, and email
            automation into one seamless workflow.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Get started in three simple steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-10 text-center">
          {steps.map((s) => (
            <div key={s.number}>
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {s.number}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTA({ user }) {
  return (
    <section className="bg-indigo-600 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Ready to study smarter?
        </h2>
        <p className="mt-4 text-indigo-100 max-w-lg mx-auto">
          Join StudentAI and let AI handle the heavy lifting so you can focus on
          learning.
        </p>
        <div className="mt-8">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-block bg-white text-indigo-600 font-medium px-8 py-3 rounded-md hover:bg-indigo-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-block bg-white text-indigo-600 font-medium px-8 py-3 rounded-md hover:bg-indigo-50 transition-colors"
            >
              Get Started for Free
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} StudentAI. All rights reserved.
      </div>
    </footer>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <Hero user={user} />
        <Features />
        <HowItWorks />
        <FooterCTA user={user} />
      </main>
      <Footer />
    </div>
  );
}
