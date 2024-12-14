import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Model, Pack, GenerationResult } from '../../types';
import { Send, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GradientText } from '../ui/GradientText';
import { PackCard } from './PackCard';
import { GeneratedImage } from './GeneratedImage';
import { GenerationPrompt } from './GenerationPrompt';

interface GenerationInterfaceProps {
  model: Model;
  packs: Pack[];
  onGenerate: (prompt: string) => Promise<GenerationResult>;
}

export function GenerationInterface({ model, packs, onGenerate }: GenerationInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await onGenerate(prompt);
      setResults(prev => [result, ...prev]);
      setPrompt('');
    } finally {
      setLoading(false);
    }
  };

  const handlePackGenerate = async (packPrompt: string) => {
    setLoading(true);
    try {
      const result = await onGenerate(packPrompt);
      setResults(prev => [result, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6" hover={false}>
        <h2 className="text-2xl font-bold mb-2">
          Generate with <GradientText>{model.name}</GradientText>
        </h2>
        <p className="text-gray-300 mb-6">Enter a prompt or choose a pack below to create amazing images</p>
        
        <GenerationPrompt
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onGenerate={() => handlePackGenerate(pack.prompts[0])}
          />
        ))}
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Generated Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <GeneratedImage key={index} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}