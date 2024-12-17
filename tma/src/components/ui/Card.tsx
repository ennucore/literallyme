import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hover?: boolean;
  images?: string[];
}

export function Card({ children, className, hover = true, images, ...props }: CardProps) {
  return (
    <motion.div
      className={cn(
        "bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden",
        hover ? "hover:bg-white/15 transition-colors" : "",
        className
      )}
      whileHover={hover ? { y: -5 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {images && images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 p-2">
          {images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Generated image ${index + 1}`}
              className="w-full h-40 object-cover rounded-lg"
            />
          ))}
        </div>
      )}
      {children}
    </motion.div>
  );
}