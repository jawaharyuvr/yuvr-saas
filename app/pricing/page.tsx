'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, ArrowLeft } from 'lucide-react';
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
    price: '$5',
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Subscription <span className="text-indigo-600">Plans</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Transparent pricing for every stage of your business. Choose the plan that fits your invoicing needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border flex flex-col transition-colors ${
                plan.highlighted 
                  ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl shadow-indigo-600/10' 
                  : 'border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              <div className="mb-8">
                <h4 className="text-xl font-bold text-slate-900">{plan.name}</h4>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                  {plan.period && <span className="ml-1 text-slate-500">{plan.period}</span>}
                </div>
                <p className="mt-2 text-slate-500 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-slate-600 text-sm">
                    <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="mt-auto">
                <Button 
                  className={`w-full py-6 rounded-xl font-bold transition-all ${
                    plan.highlighted 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-sm border border-white/40 text-center"
        >
          <h3 className="text-2xl font-bold text-slate-900">Need a custom plan?</h3>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto">
            If you have unique requirements or need a high-volume solution, our enterprise team is here to help.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" className="px-8 py-6 rounded-xl">Chat with Sales</Button>
            <Button className="px-8 py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700">Contact Support</Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
