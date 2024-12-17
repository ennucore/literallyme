import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';
import { Share2, SendHorizontal } from 'lucide-react';
import { Button } from './Button';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hover?: boolean;
  images?: string[];
  onShare?: () => void;
  onSendAsMessage?: () => void;
}

export function Card({ 
  children, 
  className, 
  hover = true, 
  images, 
  onShare,
  onSendAsMessage,
  ...props 
}: CardProps) {
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
        <>
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
          {(onShare || onSendAsMessage) && (
            <div className="px-4 py-2 flex gap-2 border-t border-white/10">
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  icon={<Share2 className="w-4 h-4" />}
                  className="hover:bg-white/10"
                >
                  Share to Story
                </Button>
              )}
              {onSendAsMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSendAsMessage}
                  icon={<SendHorizontal className="w-4 h-4" />}
                  className="hover:bg-white/10"
                >
                  Send as Message
                </Button>
              )}
            </div>
          )}
        </>
      )}
      {children}
    </motion.div>
  );
}