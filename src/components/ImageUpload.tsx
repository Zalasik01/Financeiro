import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadProps {
  currentIcon?: string;
  onIconChange: (icon: string) => void;
  currentIsDefault?: boolean; // Adicionado para consistência, mas não usado diretamente aqui
  placeholder?: string;
}

export const ImageUpload = ({
  currentIcon,
  onIconChange,
  currentIsDefault, // Recebe, mas não usa diretamente para a lógica de upload
  placeholder = "Escolher ícone",
}: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentIcon || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        onIconChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiChange = (emoji: string) => {
    setPreviewUrl(emoji);
    onIconChange(emoji);
  };

  const commonEmojis = [
    "🏪",
    "🏬",
    "🏢",
    "🏭",
    "🏛️",
    "🏰",
    "🏠",
    "🏡",
    "🏘️",
    "🏚️",
  ];

  return (
    <div className="space-y-3">
      <Label>{placeholder}</Label>
      <div className="flex items-center gap-2">
        {previewUrl && (
          <div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-gray-50">
            {previewUrl.startsWith("data:") ? (
              <img
                src={previewUrl}
                alt="Icon"
                className="w-8 h-8 object-cover rounded"
              />
            ) : (
              <span className="text-2xl">{previewUrl}</span>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm"
        >
          Upload PNG
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Ou escolha um emoji:</Label>
        <div className="flex flex-wrap gap-2">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiChange(emoji)}
              className={`w-8 h-8 text-lg hover:bg-gray-100 rounded ${
                previewUrl === emoji ? "bg-blue-100 ring-2 ring-blue-500" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
