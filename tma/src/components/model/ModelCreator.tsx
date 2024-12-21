import React from 'react';
import { Upload, ImagePlus, X, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { telegram } from '../../services/telegram';
import { useModelCreation } from '../../hooks/useModelCreation';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import { Checkbox } from '../ui/Checkbox';

interface ModelCreatorProps {
  onSubmit: (name: string, photos: File[]) => Promise<void>;
  balance: number;
}

export function ModelCreator({ onSubmit, balance }: ModelCreatorProps) {
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
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [isAdult, setIsAdult] = React.useState(false);

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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

        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="flex items-start space-x-3">
          <Checkbox
            checked={isAuthorized}
            onCheckedChange={(checked) => setIsAuthorized(checked as boolean)}
            className="mt-1"
          />
          <span className="text-sm text-white">
            I certify that I am authorized to use these photos for AI model training and content creation, 
            and I accept the terms of use of Literally Me
          </span>
        </label>

        <label className="flex items-start space-x-3">
          <Checkbox
            checked={isAdult}
            onCheckedChange={(checked) => setIsAdult(checked as boolean)}
            className="mt-1"
          />
          <span className="text-sm text-white">
            I certify that the person in the photos is over 18 years old
          </span>
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 py-4 text-lg font-medium"
        loading={loading}
        disabled={!isValid || loading || !isAuthorized || !isAdult}
        icon={<Upload className="w-5 h-5" />}
      >
        Train Model ({TELEGRAM_CONFIG.MODEL_COST} <Star className="w-4 h-4 inline text-yellow-400" />)
      </Button>
      <div className="text-center text-sm text-white mt-2">
        Balance: {balance.toString()} <Star className="w-4 h-4 inline text-yellow-400" />
      </div>
    </form>
  );
}