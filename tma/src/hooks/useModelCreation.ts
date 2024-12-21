import { useState } from 'react';
import { TELEGRAM_CONFIG } from '../config/telegram';

interface UseModelCreationReturn {
  name: string;
  setName: (name: string) => void;
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isValid: boolean;
  errorMessage: string | null;
}

export function useModelCreation(): UseModelCreationReturn {
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const isValid = photos.length >= TELEGRAM_CONFIG.MIN_PHOTOS_REQUIRED;
  const errorMessage = !isValid 
    ? `Please upload at least ${TELEGRAM_CONFIG.MIN_PHOTOS_REQUIRED} photos`
    : null;

  return {
    name,
    setName,
    photos,
    setPhotos,
    loading,
    setLoading,
    isValid,
    errorMessage
  };
}