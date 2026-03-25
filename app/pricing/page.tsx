'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { DynamicBackground } from '@/components/ui/DynamicBackground';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-transparent relative py-12 px-6">
      <DynamicBackground />
      <div className="relative z-10 max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mt-12 md:mt-24 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-semibold text-sm mb-8 shadow-sm"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            Currently In Development
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            Subscription Plans <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-indigo-600">
              Coming Soon
            </span>
          </h1>

          <p className="text-slate-500 text-xl leading-relaxed mb-12">
            We are actively crafting the perfect billing tiers to support freelancers, agencies, and enterprises with world-class features. Stay tuned for our official rollout!
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-6 shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1">
                Return to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
