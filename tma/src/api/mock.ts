import { Model, Pack, GenerationResult } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async createModel(name: string, photos: File[]): Promise<{ invoiceUrl: string }> {
    await delay(1000);
    return {
      invoiceUrl: 'https://t.me/$demo_invoice'
    };
  },

  async checkTrainingStatus(modelId: string): Promise<{ status: 'pending' | 'completed' | 'failed', progress?: number }> {
    await delay(1000);
    return {
      status: 'pending',
      progress: Math.random() * 100
    };
  },

  async listModels(): Promise<Model[]> {
    await delay(500);
    return [
      {
        id: '1',
        name: 'Literally John',
        thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
        created: new Date('2024-03-10')
      }
    ];
  },

  async listPacks(): Promise<Pack[]> {
    return [
      {
        id: 'dating',
        name: 'Dating Site Pack',
        description: 'Perfect photos for your dating profile',
        prompts: ['professional headshot smiling', 'casual outdoor portrait', 'enjoying coffee at a cafe']
      },
      {
        id: 'professional',
        name: 'Professional Pack',
        description: 'Business and professional settings',
        prompts: ['corporate environment', 'giving presentation', 'working at desk']
      }
    ];
  },

  async generateImage(modelId: string, prompt: string): Promise<GenerationResult> {
    await delay(2000);
    return {
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      prompt,
      timestamp: new Date()
    };
  },

  async downloadModel(modelId: string): Promise<{ downloadUrl: string }> {
    return {
      downloadUrl: 'https://example.com/model.safetensors'
    };
  }
};