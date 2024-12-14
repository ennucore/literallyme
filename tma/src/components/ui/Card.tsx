import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <motion.div
      className={cn(
        "bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden",
        hover && "hover:bg-white/15 transition-colors",
        className
      )}
      whileHover={hover ? { y: -5 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}