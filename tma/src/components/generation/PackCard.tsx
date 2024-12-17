import React from 'react';
import { Send } from 'lucide-react';
import { Pack } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PackCardProps {
  pack: Pack;
  onGenerate: () => void;
}

export function PackCard({ pack, onGenerate }: PackCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-3">
          {pack.thumbnail && (
            <img 
              src={pack.thumbnail} 
              alt={`${pack.name} thumbnail`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold text-white">{pack.name}</h3>
            <p className="text-sm text-gray-400">{pack.description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGenerate}
          icon={<Send className="w-4 h-4" />}
          className="hover:bg-white/10"
        >
          Generate
        </Button>
      </div>
      <div className="text-xs text-gray-500">
        {pack.prompts.slice(0, 2).join(' • ')}
        {pack.prompts.length > 2 && ' • ...'}
      </div>
    </Card>
  );
}