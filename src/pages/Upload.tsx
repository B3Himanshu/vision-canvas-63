import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, X, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  title: string;
  category: string;
  tags: string;
  description: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

const categories = [
  { id: 'nature', name: 'Nature' },
  { id: 'business', name: 'Business' },
  { id: 'travel', name: 'Travel' },
  { id: 'people', name: 'People' },
  { id: 'abstract', name: 'Abstract' },
  { id: 'food', name: 'Food' },
  { id: 'technology', name: 'Technology' },
  { id: 'architecture', name: 'Architecture' },
];

const Upload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (droppedFiles.length === 0) {
      toast.error('Please upload image files only (JPG, PNG, WebP)');
      return;
    }

    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      category: '',
      tags: '',
      description: '',
      status: 'pending',
    }));
    
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFile = (id: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    const invalidFiles = files.filter(f => !f.title || !f.category);
    if (invalidFiles.length > 0) {
      toast.error('Please fill in title and category for all images');
      return;
    }

    setIsUploading(true);

    // Simulate upload
    for (const file of files) {
      updateFile(file.id, { status: 'uploading' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateFile(file.id, { status: 'success' });
    }

    setIsUploading(false);
    toast.success('All images uploaded successfully!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Upload Your Images
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Share your creativity with the world. All uploads are free and help build our community.
            </p>
          </motion.div>

          {/* Drop Zone */}
          {files.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`relative border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border bg-card hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <motion.div
                className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6"
                animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              >
                <UploadIcon className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </motion.div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isDragging ? 'Drop images here' : 'Drag & drop images here'}
              </h3>
              <p className="text-muted-foreground mb-6">
                or click to browse files
              </p>
              
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </Button>
              
              <p className="text-sm text-muted-foreground mt-6">
                Supported formats: JPG, PNG, WebP · Max size: 20MB per image
              </p>
            </motion.div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Selected Images ({files.length})
                </h2>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add More
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-2xl p-6"
                  >
                    <div className="flex gap-6">
                      {/* Thumbnail */}
                      <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-secondary">
                        <img
                          src={file.preview}
                          alt={file.title}
                          className="w-full h-full object-cover"
                        />
                        {file.status === 'uploading' && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                          </div>
                        )}
                        {file.status === 'success' && (
                          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                            <Check className="h-8 w-8 text-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Form */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <p className="text-sm text-muted-foreground mb-1">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeFile(file.id)}
                            disabled={file.status === 'uploading'}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                              Title *
                            </label>
                            <Input
                              value={file.title}
                              onChange={(e) => updateFile(file.id, { title: e.target.value })}
                              placeholder="Image title"
                              disabled={file.status !== 'pending'}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                              Category *
                            </label>
                            <Select
                              value={file.category}
                              onValueChange={(value) => updateFile(file.id, { category: value })}
                              disabled={file.status !== 'pending'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Tags (comma separated)
                          </label>
                          <Input
                            value={file.tags}
                            onChange={(e) => updateFile(file.id, { tags: e.target.value })}
                            placeholder="nature, sunset, mountains"
                            disabled={file.status !== 'pending'}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Description
                          </label>
                          <Textarea
                            value={file.description}
                            onChange={(e) => updateFile(file.id, { description: e.target.value })}
                            placeholder="Describe your image..."
                            rows={2}
                            disabled={file.status !== 'pending'}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="gradient"
                  size="lg"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5" />
                      Upload All Images
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Upload;
