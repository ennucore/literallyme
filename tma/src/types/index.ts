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
}

export interface GenerationResult {
  url: string;
  prompt: string;
  timestamp: Date;
}