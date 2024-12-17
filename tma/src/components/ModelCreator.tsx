import React, { useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ModelCreatorProps {
  onSubmit: (name: string, photos: File[]) => Promise<void>;
}

export function ModelCreator({ onSubmit }: ModelCreatorProps) {
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length < 10) {
      alert('Please upload at least 10 photos');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(name || `Literally ${window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Me'}`, photos);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Model Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Literally Me"
      />

      <div className="relative group border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotosChange}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer block">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <ImagePlus className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">Upload your photos</p>
          <p className="mt-1 text-xs text-gray-500">Upload at least 10 photos. {photos.length} selected</p>
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={loading}
        disabled={photos.length < 10}
        icon={<Upload className="w-4 h-4" />}
      >
        Train Model (1000 stars)
      </Button>
    </form>
  );
}