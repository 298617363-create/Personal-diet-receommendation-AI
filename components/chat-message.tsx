"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface Props {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
}

export default function ChatMessage({ role, content, imageBase64 }: Props) {
  const isUser = role === "user";
  const [fullImage, setFullImage] = useState<string | null>(null);

  const imgSrc = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;

  return (
    <>
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
            isUser ? "bg-primary text-primary-foreground" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isUser ? "我" : "🥗"}
        </div>

        <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
          {imgSrc && (
            <Card className="overflow-hidden cursor-pointer" onClick={() => setFullImage(imgSrc)}>
              <img
                src={imgSrc}
                alt="上传的图片"
                className="max-w-48 max-h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </Card>
          )}

          {content && (
            <Card className={`px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser ? "bg-primary text-primary-foreground" : ""
            }`}>
              <div
                dangerouslySetInnerHTML={{ __html: formatContent(content) }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* 全屏图片查看 */}
      {fullImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setFullImage(null)}
        >
          <img
            src={fullImage}
            alt="查看大图"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full text-lg flex items-center justify-center hover:bg-white/30"
            onClick={() => setFullImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

function formatContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/^- (.+)$/gm, "• $1")
    .replace(/^(\d+)\. (.+)$/gm, "$1. $2");
}
