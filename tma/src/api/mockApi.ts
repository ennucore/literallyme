import { Model, Pack, GenerationResult, GenerationIdResult } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async auth() {
    await delay(500);
    return { token: 'mock-token-123' };
  },

  async createModel(_name: string, _photos: File[]) {
    await delay(1000);
    return {
      target_id: 'mock-target-123'
    };
  },

  async checkTrainingStatus(_target_id: string) {
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
        created: new Date('2024-03-10'),
        is_training: false
      },
      {
        id: '2',
        name: 'Literally Jane',
        thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
        created: new Date('2024-03-10'),
        is_training: true
      }
    ];
  },

  async listPacks(): Promise<Pack[]> {
    return [
      {
        id: 'dating',
        name: 'Dating Site Pack',
        thumbnail: 'https://picsum.photos/200/300',
        description: 'Perfect photos for your dating profile',
        prompts: ['professional headshot smiling', 'casual outdoor portrait', 'enjoying coffee at a cafe']
      },
      {
        id: 'professional',
        name: 'Professional Pack',
        thumbnail: 'https://picsum.photos/200/300',
        description: 'Business and professional settings',
        prompts: ['corporate environment', 'giving presentation', 'working at desk']
      }
    ];
  },

  async generateImage(_model_id: string, _prompt: string): Promise<GenerationIdResult> {
    await delay(1000);
    return {
      id: 'mock-generation-123'
    };
  },

  async getGeneration(_id: string): Promise<GenerationResult | "pending" | "failed"> {
    await delay(1000);
    if (Math.random() > 0.8) return "pending";
    if (Math.random() > 0.9) return "failed";
    
    return {
      urls: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'],
      prompt: 'mock generation',
      timestamp: new Date()
    };
  },

  async getGenerations(): Promise<(GenerationResult | GenerationIdResult)[]> {
    await delay(500);
    return [
      { id: 'mock-generation-123' },
      { urls: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'], prompt: 'mock generation', timestamp: new Date() }
    ];
  }
};