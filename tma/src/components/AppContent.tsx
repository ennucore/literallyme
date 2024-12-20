import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Model, Pack } from '../types';
import { ModelCard } from './model/ModelCard';
import { NewModelCard } from './model/NewModelCard';
import { ModelCreator } from './model/ModelCreator';
import { GenerationInterface } from './generation/GenerationInterface';
import { listModels, downloadModel, generateImage, listPacks, createModel, createModelInvoiceUrl, getBalance } from '../api/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { PageTransition } from './layout/PageTransition';
import { GradientText } from './ui/GradientText';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { getWebApp } from '../utils/telegram';

export function AppContent() {
  const user = useTelegramUser();
  const [models, setModels] = useState<Model[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isCreating, _setIsCreating] = useState(false);
  const [balance, setBalance] = useState(0);
  const setIsCreating = (value: boolean) => {
    _setIsCreating(value);
    if (value === true) {
      getWebApp().BackButton.show();
      getWebApp().BackButton.onClick(() => {
        setIsCreating(false);
      });
    } else {
      getWebApp().BackButton.hide();
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const [modelsList, packsList, balance] = await Promise.all([
        listModels(),
        listPacks(),
        getBalance()
      ]);
      setModels(modelsList);
      setPacks(packsList);
      setBalance(balance);
    };
    loadInitialData();
  }, []);



  const handleCreateModel = async (name: string, photos: File[]) => {
    const handleInvoiceCallback = async (status: "paid" | "cancelled" | "failed" | "pending") => {
      if (status === 'paid') {
        await createModel(name, photos);
        const newBalance = await getBalance();
        setBalance(newBalance);
        createModel(name, photos);
      }
    };

    getWebApp().openInvoice(createModelInvoiceUrl, handleInvoiceCallback);
  };

  const handleDownloadModel = async (modelId: string) => {
    const { downloadUrl } = await downloadModel(modelId);
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <PageTransition key="creator">
              <div className="max-w-md mx-auto glass-effect rounded-xl p-6">
                <div className="flex items-center gap-4 mb-8">
                  <h1 className="text-2xl font-bold">
                    <GradientText>Create New Model</GradientText>
                  </h1>
                </div>
                <ModelCreator 
                  onSubmit={handleCreateModel} 
                  balance={balance || 0}
                />
              </div>
            </PageTransition>
          ) : selectedModel ? (
            <PageTransition key="generator">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedModel(null)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                  className="mb-8"
                >
                  Back
                </Button>
                <GenerationInterface
                  model={selectedModel}
                  packs={packs}
                  onGenerate={(prompt) => generateImage(selectedModel.id, prompt)}
                  balance={balance}
                />
              </div>
            </PageTransition>
          ) : (
            <PageTransition key="models">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                  <GradientText>Your Models</GradientText>
                </h1>
                <p className="text-gray-300">
                  {user ? `Welcome, ${user.first_name}! ` : ''}
                  Select a model to start generating images or create a new one
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NewModelCard onClick={() => setIsCreating(true)} />
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onSelect={() => setSelectedModel(model)}
                    onDownload={() => handleDownloadModel(model.id)}
                  />
                ))}
              </div>
            </PageTransition>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}