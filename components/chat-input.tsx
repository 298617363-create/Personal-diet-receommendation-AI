"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSend: (text: string, imageBase64?: string) => void;
  loading: boolean;
}

export default function ChatInput({ onSend, loading }: Props) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !imageBase64) return;
    onSend(trimmed, imageBase64 ?? undefined);
    setText("");
    setImagePreview(null);
    setImageBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result.split(",")[1]);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="border-t bg-background p-3 space-y-2">
      {/* 图片预览 */}
      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="预览"
            className="max-h-32 rounded-lg"
          />
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
            onClick={() => {
              setImagePreview(null);
              setImageBase64(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex items-end gap-2">
        {/* 拍照按钮 */}
        <button
          type="button"
          className="shrink-0 w-10 h-10 rounded-full border flex items-center justify-center text-lg hover:bg-muted transition-colors"
          onClick={() => fileRef.current?.click()}
          title="上传图片"
        >
          📷
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，或上传照片..."
          className="flex-1"
          disabled={loading}
        />

        <Button
          onClick={handleSend}
          disabled={loading || (!text.trim() && !imageBase64)}
          className="shrink-0"
          size="sm"
        >
          {loading ? "..." : "发送"}
        </Button>
      </div>
    </div>
  );
}
