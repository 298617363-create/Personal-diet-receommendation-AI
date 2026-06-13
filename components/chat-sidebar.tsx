"use client";

import { ChatSession } from "@/lib/chat-storage";
import { Button } from "@/components/ui/button";

interface Props {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (session: ChatSession) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export default function ChatSidebar({
  sessions,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-muted/20 border-r">
      {/* 新对话按钮 */}
      <div className="p-3 border-b">
        <Button onClick={() => { onNew(); onClose?.(); }} className="w-full" size="sm">
          ＋ 新对话
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            暂无历史对话
          </p>
        ) : (
          <div className="p-2 space-y-1">
            {[...sessions].reverse().map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  s.id === currentId
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                }`}
                onClick={() => { onSelect(s); onClose?.(); }}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate">{s.title || "新对话"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 shrink-0 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  title="删除"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
