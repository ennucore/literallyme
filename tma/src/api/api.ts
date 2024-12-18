import { Model, Pack, GenerationResult, GenerationIdResult } from '../types';
import axios from 'axios';
import { getWebApp } from '../utils/telegram';
import JSZip from 'jszip';
import { mockApi } from './mockApi';
const API_URL = import.meta.env.VITE_API_URL || 'https://api-service-923310519975.us-central1.run.app';
const MOCK = true;   // import.meta.env.VITE_MOCK === 'true';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fallback storage for browsers/versions that don't support CloudStorage
const fallbackStorage = {
  async getItem(key: string) {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    localStorage.removeItem(key);
  }
};

// Get the appropriate storage mechanism
const getStorage = () => {
  // const webApp = getWebApp();
  // try {
  //   if (webApp.CloudStorage && webApp.isVersionAtLeast('6.1')) {
  //     return webApp.CloudStorage;
  //   }
  // } catch {
  //   console.warn('CloudStorage not available, using fallback storage');
  // }
  return fallbackStorage;
};

// Add token to all requests if it exists
api.interceptors.request.use(async (config) => {
  try {
    const storage = getStorage();
    const token = await storage.getItem("token");
    if (token != null) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch {
    return config;
  }
});

// Handle response errors
api.interceptors.response.use(
  response => response,
  error => {
    return Promise.reject(error);
  }
);

export const auth = async () => {
  if (MOCK) return mockApi.auth();
  
  try {
    const webApp = getWebApp();
    const storage = getStorage();

    // Check if we already have a valid token
    const existingToken = await storage.getItem("token");
    if (existingToken != null) {
      return { token: existingToken };
    }

    // If no token, perform auth
    if (!webApp.initData) {
      throw new Error('No init data available');
    }
    const response = await api.post(`/authenticate?${getWebApp().initData}`);
    console.log(response.data);
    console.log(response.data?.token);

    if (response.data?.token) {
      await storage.setItem("token", response.data.token);
      return response.data;
    }
    
    throw new Error('No token received');
  } catch (error) {
    console.warn('Auth error:', error);
    return null; // Return null instead of throwing to prevent app crash
  }
};

export const createModelInvoiceUrl = 'https://t.me/$cTk0qFsyCUs5EAAAP07dMEZzjEY';

export const createModel = async (name: string, photos: File[]) => {
  // make a request with the api to "/upload_archive_url" with {userId: userId.toString()}
  const { upload_url, target_id } = (await api.post('/upload_archive_url', { userId: getWebApp().initDataUnsafe?.user?.id.toString(), name })).data;
  // Create zip archive of photos
  const zip = new JSZip();
  for (let i = 0; i < photos.length; i++) {
    zip.file(`photo_${i+1}.jpg`, photos[i]);
  }
  
  // Generate zip blob
  const zipBlob = await zip.generateAsync({type: "blob"});

  // Upload zip to signed URL
  await fetch(upload_url, {
    method: 'PUT',
    body: zipBlob,
    headers: {
      'Content-Type': 'application/zip'
    }
  });

  // Start training process
  await api.post('/start_training', {
    target_id: target_id,
  });

  
  return {
    target_id: target_id
  };
};

export const checkTrainingStatus = async (target_id: string) => {
  if (MOCK) return mockApi.checkTrainingStatus(target_id);
  const response = await api.get(`/check_training_status?target_id=${target_id}`);
  return response.data;
};

export const listModels = async (): Promise<Model[]> => {
  if (MOCK) return mockApi.listModels();
  const response = await api.get('/list_models');
  return response.data;
};

export const listPacks = async (): Promise<Pack[]> => {
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
};

// TODO: Remove
export const downloadModel = async (target_id: string) => {
  const response = await api.get(`/download_model?target_id=${target_id}`);
  return response.data;
};

export const generateImage = async (model_id: string, prompt: string): Promise<GenerationIdResult> => {
  if (MOCK) return mockApi.generateImage(model_id, prompt);

  const response = await api.post('/generate_image', {
    target_id: model_id,
    prompt: prompt,
    user_id: getWebApp().initDataUnsafe?.user?.id.toString()
  });
  return response.data;
};

export const getGeneration = async (id: string): Promise<GenerationResult | "pending" | "failed"> => {
  if (MOCK) return mockApi.getGeneration(id);

  const response = await api.get(`/get_generation?id=${id}`);
  return response.data;
};

export const getGenerations = async (): Promise<(GenerationResult | GenerationIdResult)[]> => {
  if (MOCK) return mockApi.getGenerations();

  const response = await api.get('/get_generations');
  return response.data;
};
