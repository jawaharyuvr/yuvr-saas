'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, ArrowRight, Shield, Zap, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { DynamicBackground } from '@/components/ui/DynamicBackground';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started.',
    features: ['5 Invoices per month', 'Basic PDF generation', 'Client management', 'Single user'],
    cta: 'Start for Free',
    href: '/signup',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Best for freelancers and small teams.',
    features: ['Unlimited Invoices', 'Premium PDF Layouts', 'Custom Branding & Logo', 'Multiple Currencies', 'Email Support'],
    cta: 'Go Pro',
    href: '/signup',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Advanced features for large agencies.',
    features: ['Team Collaboration', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', '24/7 Priority Support'],
    cta: 'Contact Sales',
    href: '/signup',
    highlighted: false
  }
];

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -45 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  const titleText1 = "Professional Invoicing".split(" ");
  const titleText2 = "Made Simple.".split(" ");
  const paragraphWords = "Generate, manage and track your invoices with ease. Professional PDF generation, client management, and automated tracking all in one place.".split(" ");

  return (
    <main className="min-h-screen bg-transparent overflow-hidden relative">
      <DynamicBackground />

      {/* Hero Section */}
      <motion.nav
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 bg-white/70 backdrop-blur-xl border border-white/50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-3xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-500"
      >
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
          }}
          transition={{
            opacity: { duration: 0.5 },
            x: { duration: 0.5 },
            backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" }
          }}
          className="text-3xl font-extrabold pb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 bg-[length:200%_auto] tracking-tight"
        >
          Yuvr's
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4 items-center"
        >
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all">Get Started</Button>
          </Link>
        </motion.div>
      </motion.nav>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-32 text-center"
      >
        <motion.h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight [perspective:1000px] flex flex-col items-center">
          <div className="flex justify-center gap-[0.25em] flex-wrap">
            {titleText1.map((word, i) => (
              <motion.span key={i} variants={wordVariants} className="text-slate-900 inline-block origin-bottom">{word}</motion.span>
            ))}
          </div>
          <div className="flex justify-center gap-[0.25em] mt-2 lg:mt-4 pb-4">
            {titleText2.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                className="inline-block origin-bottom drop-shadow-sm"
              >
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-indigo-600 bg-[length:200%_auto]"
                >
                  {word}
                </motion.span>
              </motion.span>
            ))}
          </div>
        </motion.h2>

        <motion.div
          className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed overflow-hidden"
        >
          <div className="flex flex-wrap justify-center gap-x-[0.3em] gap-y-1">
            {paragraphWords.map((word, i) => (
              <motion.span key={i} variants={wordVariants} className="inline-block origin-bottom">
                {word}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20">
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-indigo-200 hover:shadow-indigo-100/60 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
              <FileText size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Templates</h3>
            <p className="text-slate-600 text-center leading-relaxed">Professional templates that adapt to your brand automatically.</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-fuchsia-200 hover:shadow-fuchsia-100/60 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-fuchsia-50 text-fuchsia-600 rounded-2xl border border-fuchsia-100 flex items-center justify-center mb-6 shadow-sm">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Generation</h3>
            <p className="text-slate-600 text-center leading-relaxed">Create and send invoices in seconds, not hours.</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-cyan-200 hover:shadow-cyan-100/60 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100 flex items-center justify-center mb-6 shadow-sm">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Tracking</h3>
            <p className="text-slate-600 text-center leading-relaxed">Never lose track of a payment with secure cloud storage.</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/signup">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="px-10 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">
                Start for Free
              </Button>
            </motion.div>
          </Link>
          <Link href="/pricing" className="text-sm font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition-colors">
            Subscription Plan <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </motion.div>
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 border-t border-slate-200/50 bg-white/50 backdrop-blur-md py-12"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm">© 2026 Yuvr's. All rights reserved.</p>
          <div className="flex gap-8 text-sm text-slate-500">
            <Link href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-indigo-600 transition-colors">Contact</Link>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}
