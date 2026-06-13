interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
}

export interface ChatSession {
  id: string;
  title: string;       // 用第一条用户消息做标题
  createdAt: string;   // ISO 时间
  messages: ChatMessage[];
}

const SESSIONS_KEY = "diet-chat-sessions";
const DAILY_DATA_KEY = "diet-daily-data";

// ===== 会话管理 =====

export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  // 只保留最近 3 天的会话
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recent = sessions.filter((s) => {
    try {
      return new Date(s.createdAt).getTime() > threeDaysAgo;
    } catch {
      return false;
    }
  });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(recent));
}

export function saveSession(id: string, messages: ChatMessage[]) {
  const sessions = loadSessions();
  const existing = sessions.find((s) => s.id === id);

  // 用第一条用户消息做标题
  const firstUserMsg = messages.find((m) => m.role === "user");
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
    : "新对话";

  if (existing) {
    existing.messages = messages;
    existing.title = title;
  } else {
    sessions.push({
      id,
      title,
      createdAt: new Date().toISOString(),
      messages,
    });
  }

  saveSessions(sessions);
}

export function deleteSession(id: string) {
  const sessions = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// ===== 每日数据记忆 =====

interface StoredDailyData {
  date: string; // YYYY-MM-DD
  weight: string;
  exerciseType: string;
  exerciseStartTime: string;
  exerciseEndTime: string;
  exerciseIntensity: "low" | "medium" | "high";
}

export function loadTodayData(): StoredDailyData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAILY_DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (data.date !== today) return null;
    // 兼容旧格式（缺少新字段时给默认值）
    return {
      date: data.date,
      weight: data.weight || "",
      exerciseType: data.exerciseType || "",
      exerciseStartTime: data.exerciseStartTime || "",
      exerciseEndTime: data.exerciseEndTime || "",
      exerciseIntensity: data.exerciseIntensity || "medium",
    };
  } catch {
    // ignore
  }
  return null;
}

export function saveTodayData(data: Omit<StoredDailyData, "date">) {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(DAILY_DATA_KEY, JSON.stringify({ ...data, date: today }));
}
