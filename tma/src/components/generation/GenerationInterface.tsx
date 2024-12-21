import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Model, Pack, GenerationResult, GenerationIdResult } from '../../types';
import { Send, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GradientText } from '../ui/GradientText';
import { getGeneration, getGenerations } from '../../api/api';
import { jelly } from 'ldrs';
import { getWebApp } from '../../utils/telegram';
import { GenerationPrompt } from './GenerationPrompt';


jelly.register();


interface GenerationInterfaceProps {
  model: Model;
  packs: Pack[];
  onGenerate: (prompt: string) => Promise<GenerationIdResult>;
  balance: number;
}

export function GenerationInterface({ model, packs, onGenerate, balance }: GenerationInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [allGenerations, setAllGenerations] = useState<(GenerationResult | GenerationIdResult)[]>([]);

  useEffect(() => {
    const loadGenerations = async () => {
      const generations = await getGenerations();
      setAllGenerations(generations);
    };
    loadGenerations();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadGenerations, 5000);
    return () => clearInterval(interval);
  }, []);

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
          setAllGenerations(prev => [...prev, result]);
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
        <p className="text-gray-400 mb-2">Enter a prompt or choose a pack below to create amazing images</p>
        <p className="text-sm text-gray-400 mb-6">
          Cost: 1 <Star className="w-4 h-4 inline text-yellow-400" /> • Balance: {balance} <Star className="w-4 h-4 inline text-yellow-400" />
        </p>
        
        <GenerationPrompt
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
        />
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

      <div className="space-y-4">
        {allGenerations.map((gen, index) => (
          <motion.div
            key={('id' in gen) ? gen.id : index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            {'urls' in gen ? (
              <Card 
                className="overflow-hidden" 
                hover={false} 
                images={gen.urls}
                onShare={() => {
                  // Share first image to story
                  if (gen.urls && gen.urls.length > 0) {
                    getWebApp().shareToStory(gen.urls[0], {
                      text: 'This is literally me!',
                      widget_link: {
                        url: 'https://t.me/literallymebot',
                        name: 'Literally Me'
                      }
                    });
                  }
                }}
              >
                <div className="p-4">
                  <p className="text-sm text-gray-300 font-medium">{gen.prompt}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated on {gen.timestamp.toLocaleString()}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-6 flex items-center justify-center">
                <l-jelly
                  size="40"
                  speed="0.9"
                  color="white"
                ></l-jelly>
                <span className="ml-3 text-gray-400">Generation in progress...</span>
              </Card>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}