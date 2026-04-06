'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDLogo } from './ThreeDLogo';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message = 'Yuvr\'s is loading...', fullScreen = true }: PageLoaderProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xl transition-all duration-700"
    : "w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-transparent";

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1, y: -20 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center w-full max-w-md px-6"
      >
        <div className="w-full relative">
          <ThreeDLogo />
        </div>

        <div className="text-center space-y-4 -mt-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x tracking-tight">
              {message}
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Preparing your workspace</p>
          </motion.div>
          
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Background Decorative Elements */}
      {fullScreen && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-100/40 rounded-full blur-[120px]" />
        </div>
      )}
    </div>
  );
}
