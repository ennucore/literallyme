export interface Model {
  id: string;
  name: string;
  thumbnail: string;
  created: Date;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  prompts: string[];
  thumbnail: string;
}

export interface GenerationResult {
  urls: string[];
  prompt: string;
  timestamp: Date;
}

export interface GenerationIdResult {
  id: string;
}