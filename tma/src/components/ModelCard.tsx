import React from 'react';
import { motion } from 'framer-motion';
import { Model } from '../types';
import { Download, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ModelCardProps {
  model: Model;
  onSelect: () => void;
  onDownload: () => void;
}

export function ModelCard({ model, onSelect, onDownload }: ModelCardProps) {
  return (
    <Card className="relative overflow-hidden cursor-pointer group" onClick={onSelect}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent"
        initial={{ opacity: 0.6 }}
        whileHover={{ opacity: 0.8 }}
      />
      
      <motion.img 
        src={model.thumbnail} 
        alt={model.name}
        className="w-full h-56 object-cover"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold leading-tight text-white drop-shadow-lg">
            {model.name}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="!text-white hover:!bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            icon={<Download className="w-4 h-4" />}
          >
            Download
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-200 drop-shadow">
            Created {model.created.toLocaleDateString()}
          </p>
          
          <Button
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            onClick={onSelect}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Generate Images
          </Button>
        </div>
      </div>
    </Card>
  );
}