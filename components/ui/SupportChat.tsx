'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from './Button';

const KNOWLEDGE_BASE = [
  {
    keywords: ['invoice', 'generate', 'create', 'make'],
    answer: "To generate an invoice, go to your Dashboard, click 'Invoices' in the sidebar, and then click 'Create New Invoice'. You can then add client details, line items, and customize the styling."
  },
  {
    keywords: ['branding', 'logo', 'color', 'font'],
    answer: "You can customize your branding in Settings -> Branding. Upload your company logo, choose your primary brand color, and select a professional font that will automatically apply to all your PDF invoices."
  },
  {
    keywords: ['client', 'add client', 'customer'],
    answer: "Manage your clients in the 'Clients' section. You can add new clients with their billing details, which makes generating invoices faster as their information will be auto-filled."
  },
  {
    keywords: ['upi', 'qr', 'payment', 'pay'],
    answer: "To enable UPI QR codes on your invoices, go to Settings -> Payment. Enter your UPI ID and toggle 'Enable QR Code'. A dynamic QR code will then be generated on every invoice for instant payments."
  },
  {
    keywords: ['support', 'help', 'contact', 'email'],
    answer: "For technical or functional issues, you can reach out directly via Settings -> Contact Support, or email us at jawaharyuvr@gmail.com."
  },
  {
    keywords: ['pricing', 'plan', 'pro', 'enterprise', 'free'],
    answer: "Yuvr offers Free, Pro ($19/mo), and Enterprise plans. Pro includes unlimited invoices, custom branding, and multiple currencies. Check out the Pricing page for more details!"
  }
];

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hi! I'm Yuvr's. How can I help you with your functional queries today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const lowerInput = inputValue.toLowerCase();
      let bestMatch = KNOWLEDGE_BASE.find(item =>
        item.keywords.some(keyword => lowerInput.includes(keyword))
      );

      const botResponse = bestMatch
        ? bestMatch.answer
        : "I'm not quite sure about that specific query. For functional advice, I recommend checking our Settings -> Help section or emailing jawaharyuvr@gmail.com. Can I help with anything else like Invoicing or Branding?";

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] h-[500px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Yuvr's</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/80 font-medium tracking-wider uppercase">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-xl transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {msg.role === 'bot' && (
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 mb-1">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-3 text-xs leading-relaxed ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md'
                        : 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center h-8">
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a functional query..."
                  className="flex-1 bg-transparent border-none outline-none px-2 text-xs text-slate-700 placeholder:text-slate-400"
                />
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0"
                  onClick={handleSend}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </Button>
              </div>
              <p className="text-[9px] text-center text-slate-400 mt-2 font-medium tracking-tighter uppercase">Powered by Yuvr's</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center justify-center relative overflow-hidden group"
        aria-label="Toggle chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Sparkles className="absolute -top-1 -right-1 text-white/50 animate-pulse" size={14} />
              <MessageSquare size={28} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
      </motion.button>
    </div>
  );
}
