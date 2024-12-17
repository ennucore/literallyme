import React from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

interface GenerationPromptProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function GenerationPrompt({ value, onChange, onGenerate, loading }: GenerationPromptProps) {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your perfect photo..."
          className="w-full min-h-[120px] px-5 py-4 rounded-xl bg-white/5 backdrop-blur-xl
                     border border-white/10 text-white placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50
                     transition-all duration-200 resize-none text-base leading-relaxed"
          style={{ 
            boxShadow: "0 0 40px rgba(123, 31, 162, 0.05)",
          }}
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {value.length} characters
          </span>
          <Button
            onClick={onGenerate}
            disabled={loading || !value.trim()}
            loading={loading}
            className="bg-gradient-to-r from-purple-500 to-purple-600 
                       hover:from-purple-600 hover:to-purple-700 
                       active:from-purple-700 active:to-purple-800
                       text-white font-medium
                       shadow-[0_0_20px_rgba(168,85,247,0.35)]
                       hover:shadow-[0_0_25px_rgba(168,85,247,0.45)]
                       active:shadow-[0_0_15px_rgba(168,85,247,0.25)]
                       border-0 px-4 py-2
                       disabled:from-gray-600/50 disabled:to-gray-700/50 
                       disabled:shadow-none disabled:cursor-not-allowed
                       transform hover:-translate-y-0.5 active:translate-y-0
                       transition-all duration-200 ease-out"
            icon={<Wand2 className="w-4 h-4 mr-2" />}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
      
      {/* Optional: Add some example prompts */}
      <div className="flex flex-wrap gap-2 px-1">
        <span className="text-xs text-gray-500">Try:</span>
        {['a sunset over mountains', 'cyberpunk city', 'abstract art'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onChange(suggestion)}
            className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10
                     px-3 py-1 rounded-full transition-colors duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}