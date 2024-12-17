import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from './ui/Card';
import { motion } from 'framer-motion';

interface NewModelCardProps {
  onClick: () => void;
}

export function NewModelCard({ onClick }: NewModelCardProps) {
  return (
    <Card 
      className="relative overflow-hidden cursor-pointer h-full min-h-[14rem] group"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
      
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <motion.div
          className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Plus className="w-8 h-8 text-white" />
        </motion.div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Create New Model</h3>
          <p className="text-sm text-gray-300">Train a new AI model with your photos</p>
        </div>
      </div>
    </Card>
  );
}