import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Model, Pack, GenerationResult, GenerationIdResult } from '../../types';
import { Send, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { GradientText } from '../ui/GradientText';
import { getGeneration } from '../../api/api';

interface GenerationInterfaceProps {
  model: Model;
  packs: Pack[];
  onGenerate: (prompt: string) => Promise<GenerationIdResult>;
}

export function GenerationInterface({ model, packs, onGenerate }: GenerationInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { id } = await onGenerate(prompt);
      
      // Start polling for results
      const pollInterval = setInterval(async () => {
        const result = await getGeneration(id);
        
        if (result === "failed") {
          clearInterval(pollInterval);
          setLoading(false);
          // Handle error state here
        } else if (result !== "pending") {
          clearInterval(pollInterval);
          setResult(result);
          setLoading(false);
        }
      }, 1000);

      // Cleanup interval after 5 minutes (optional timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setLoading(false);
          // Handle timeout error here
        }
      }, 5 * 60 * 1000);

    } catch {
      setLoading(false);
      // Handle error here
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6" hover={false}>
        <h2 className="text-2xl font-bold mb-2">
          Generate with <GradientText>{model.name}</GradientText>
        </h2>
        <p className="text-gray-400 mb-4">Enter a prompt or choose a pack below to create amazing images</p>
        
        <div className="flex gap-3">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your perfect photo..."
            className="flex-1 glass-effect !border-white/20 !text-white placeholder:text-gray-400"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            loading={loading}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            icon={<Wand2 className="w-4 h-4" />}
          >
            Generate
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => (
          <Card key={pack.id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{pack.name}</h3>
                <p className="text-sm text-gray-400">{pack.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGenerate(pack.prompts[0])}
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
        ))}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
        >
          <Card className="overflow-hidden" hover={false} images={result.urls}>
            <div className="p-4">
              <p className="text-sm text-gray-300 font-medium">{result.prompt}</p>
              <p className="text-xs text-gray-500 mt-1">
                Generated on {result.timestamp.toLocaleString()}
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}