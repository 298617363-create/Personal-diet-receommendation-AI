"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { loadSettings } from "@/lib/storage";
import { UserSettings, DEFAULT_SETTINGS } from "@/lib/types";
import {
  loadSessions,
  saveSession,
  deleteSession,
  loadTodayData,
  saveTodayData,
  ChatSession,
} from "@/lib/chat-storage";
import ChatMessage from "@/components/chat-message";
import ChatInput from "@/components/chat-input";
import DailyPanel, { DailyData, dailyDataToText } from "@/components/daily-panel";
import ChatSidebar from "@/components/chat-sidebar";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "久坐",
  light: "轻度活动",
  moderate: "中度活动",
  active: "高度活动",
  very_active: "极高活动",
};

const PACE_LABELS: Record<string, string> = {
  mild: "温和减重",
  moderate: "标准减重",
  aggressive: "激进减重",
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "你好！我是你的私人营养师 **小餐** 🥗\n\n在上面填好**今日体重和运动计划**，然后在聊天里告诉我你已经**吃了什么**（可以拍照），我会给你推荐 **3 个外卖友好** 的餐食选项。\n\n不满意随时说，我帮你换！",
};

export default function Home() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 会话
  const [sessionId, setSessionId] = useState<string>(genId());
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // 每日数据
  const [dailyData, setDailyData] = useState<DailyData>({
    weight: "",
    exerciseType: "",
    exerciseStartTime: "",
    exerciseEndTime: "",
    exerciseIntensity: "medium",
  });

  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef(messages);
  msgRef.current = messages;

  // 初始化（客户端加载真实数据，避免 SSR 水合不一致）
  useEffect(() => {
    setSettings(loadSettings());
    setSessions(loadSessions());
    const today = loadTodayData();
    if (today) {
      setDailyData({
        weight: today.weight,
        exerciseType: today.exerciseType,
        exerciseStartTime: today.exerciseStartTime || "",
        exerciseEndTime: today.exerciseEndTime || "",
        exerciseIntensity: today.exerciseIntensity,
      });
    }
  }, []);

  // 自动滚动
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 保存会话（每次消息变化后延迟保存）
  useEffect(() => {
    if (messages.length <= 1) return; // 跳过仅欢迎消息
    const timer = setTimeout(() => {
      saveSession(sessionId, msgRef.current);
      setSessions(loadSessions());
    }, 500);
    return () => clearTimeout(timer);
  }, [messages, sessionId]);

  // 每日数据变化时保存
  const handleDailyChange = useCallback((data: DailyData) => {
    setDailyData(data);
    saveTodayData({
      weight: data.weight,
      exerciseType: data.exerciseType,
      exerciseStartTime: data.exerciseStartTime,
      exerciseEndTime: data.exerciseEndTime,
      exerciseIntensity: data.exerciseIntensity,
    });
  }, []);

  // 发送消息
  async function handleSend(text: string, imageBase64?: string) {
    const userMsg: Message = { role: "user", content: text, imageBase64 };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const currentSettings = loadSettings();
      setSettings(currentSettings);

      const dailyContext = dailyDataToText(dailyData);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.slice(0, -1),
          newMessage: text,
          imageBase64,
          dailyContext,
          settings: {
            gender: currentSettings.gender,
            height: currentSettings.height,
            age: currentSettings.age,
            targetWeight: currentSettings.targetWeight,
            dietPace: currentSettings.dietPace,
            activityLevel: currentSettings.activityLevel,
            dietaryRestrictions: currentSettings.dietaryRestrictions,
            healthNotes: currentSettings.healthNotes,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "请求失败");
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "网络错误，请重试";
      setMessages([
        ...newMessages,
        { role: "assistant", content: `抱歉，出了点问题：${errMsg}\n\n请稍后重试。` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // 切换会话
  function handleSelectSession(session: ChatSession) {
    setSessionId(session.id);
    setMessages(session.messages);
  }

  // 新建会话
  function handleNewChat() {
    const newId = genId();
    setSessionId(newId);
    setMessages([WELCOME_MSG]);
  }

  // 删除会话
  function handleDeleteSession(id: string) {
    deleteSession(id);
    setSessions(loadSessions());
    if (id === sessionId) {
      handleNewChat();
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] max-w-5xl mx-auto">
      {/* 遮罩层（移动端侧边栏打开时） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-background border-r transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <ChatSidebar
          sessions={sessions}
          currentId={sessionId}
          onSelect={handleSelectSession}
          onNew={handleNewChat}
          onDelete={handleDeleteSession}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* 主对话区 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 顶栏（汉堡菜单 + 设置摘要） */}
        <div className="border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2 px-4 py-1.5">
            {/* 汉堡菜单 */}
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <button
              className="flex-1 text-xs text-muted-foreground hover:text-foreground flex items-center justify-between min-w-0"
              onClick={() => setShowSettings(!showSettings)}
            >
              <span className="truncate">
                ⚙️ {settings.height}cm · {settings.gender === "male" ? "男" : "女"} ·{" "}
                {settings.age}岁 · 目标{settings.targetWeight}kg ·{" "}
                {PACE_LABELS[settings.dietPace] || "标准减重"}
              </span>
              <span className="text-xs shrink-0 ml-2">{showSettings ? "▲" : "▼"}</span>
            </button>
          </div>
          {showSettings && (
            <div className="px-4 pb-2 text-xs text-muted-foreground space-y-1">
              <p>基础活动：{ACTIVITY_LABELS[settings.activityLevel] || "未设置"}</p>
              {settings.dietaryRestrictions && <p>饮食限制：{settings.dietaryRestrictions}</p>}
              {settings.healthNotes && <p>健康备注：{settings.healthNotes}</p>}
              <Link href="/settings" className="text-primary hover:underline inline-block mt-1">
                修改设置 →
              </Link>
            </div>
          )}
        </div>

        {/* 每日数据面板 */}
        <DailyPanel data={dailyData} onChange={handleDailyChange} />

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              imageBase64={msg.imageBase64}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 输入栏 */}
        <ChatInput onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
}
