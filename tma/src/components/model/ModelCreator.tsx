import React from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { telegram } from '../../services/telegram';
import { useModelCreation } from '../../hooks/useModelCreation';
import { TELEGRAM_CONFIG } from '../../config/telegram';

interface ModelCreatorProps {
  onSubmit: (name: string, photos: File[]) => Promise<void>;
}

export function ModelCreator({ onSubmit }: ModelCreatorProps) {
  const {
    name,
    setName,
    photos,
    setPhotos,
    loading,
    setLoading,
    isValid,
    errorMessage
  } = useModelCreation();

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    setLoading(true);
    try {
      await onSubmit(
        name || `Literally ${telegram.userName || 'Me'}`,
        photos
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Model Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Literally Me"
          className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      <div className="relative group border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotosChange}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer block">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <ImagePlus className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm font-medium text-white">Upload your photos</p>
          <p className="mt-1 text-xs text-gray-300">
            Upload at least {TELEGRAM_CONFIG.MIN_PHOTOS_REQUIRED} photos. {photos.length} selected
          </p>
          {errorMessage && (
            <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
          )}
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-white/10 hover:bg-white/20"
        loading={loading}
        disabled={!isValid || loading}
        icon={<Upload className="w-4 h-4" />}
      >
        Train Model ({TELEGRAM_CONFIG.MODEL_COST} stars)
      </Button>
    </form>
  );
}