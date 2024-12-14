import React from 'react';
import { motion } from 'framer-motion';
import { GenerationResult } from '../../types';
import { Card } from '../ui/Card';
import { ExternalLink } from 'lucide-react';

interface GeneratedImageProps {
  result: GenerationResult;
}

export function GeneratedImage({ result }: GeneratedImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
    >
      <Card className="overflow-hidden group" hover={false}>
        <div className="relative">
          <img 
            src={result.url} 
            alt={result.prompt} 
            className="w-full h-64 object-cover"
          />
          <a 
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-6 h-6 text-white" />
          </a>
        </div>
        <div className="p-4">
          <p className="text-sm text-white font-medium line-clamp-2">{result.prompt}</p>
          <p className="text-xs text-gray-400 mt-1">
            Generated on {result.timestamp.toLocaleString()}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}