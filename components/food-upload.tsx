"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
  buttonLabel: string;
  loadingLabel: string;
  onUpload: (base64: string) => Promise<void>;
  loading: boolean;
}

export default function FoodUpload({
  title,
  description,
  buttonLabel,
  loadingLabel,
  onUpload,
  loading,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉 data:image/...;base64, 前缀
      const b64 = result.split(",")[1];
      setBase64(b64);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleUpload() {
    if (!base64) return;
    onUpload(base64);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 上传区域 */}
        {!preview ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-2xl mb-2">📷</p>
            <p className="text-sm text-muted-foreground">点击选择照片</p>
          </div>
        ) : (
          <div className="space-y-3">
            <img
              src={preview}
              alt="预览"
              className="w-full rounded-lg max-h-64 object-cover"
            />
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setPreview(null);
                setBase64(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              重新选择
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          onClick={handleUpload}
          disabled={!base64 || loading}
          className="w-full"
        >
          {loading ? loadingLabel : buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
