import React from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface GenerationPromptProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function GenerationPrompt({ value, onChange, onGenerate, loading }: GenerationPromptProps) {
  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your perfect photo..."
        className="w-full h-32 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
      />
      <Button
        onClick={onGenerate}
        disabled={loading || !value.trim()}
        loading={loading}
        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white"
        icon={<Wand2 className="w-4 h-4" />}
      >
        Generate
      </Button>
    </div>
  );
}