"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DailyData {
  weight: string;
  exerciseType: string;
  exerciseStartTime: string;
  exerciseEndTime: string;
  exerciseIntensity: "low" | "medium" | "high";
}

interface Props {
  data: DailyData;
  onChange: (data: DailyData) => void;
}

export default function DailyPanel({ data, onChange }: Props) {
  function update(partial: Partial<DailyData>) {
    onChange({ ...data, ...partial });
  }

  return (
    <div className="border-b bg-muted/20 px-4 py-2 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">📋 今日数据（填好就不用每次说了）</p>

      {/* 体重 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-14 shrink-0">体重(kg)</span>
        <Input
          type="number"
          placeholder="如 72"
          value={data.weight}
          onChange={(e) => update({ weight: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* 运动 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-14 shrink-0">运动</span>
        <Input
          placeholder="类型（如慢跑）"
          value={data.exerciseType}
          onChange={(e) => update({ exerciseType: e.target.value })}
          className="h-8 text-sm w-20"
        />
        <Input
          type="time"
          value={data.exerciseStartTime}
          onChange={(e) => update({ exerciseStartTime: e.target.value })}
          className="h-8 text-sm w-24"
          title="开始时间"
        />
        <span className="text-xs text-muted-foreground">至</span>
        <Input
          type="time"
          value={data.exerciseEndTime}
          onChange={(e) => update({ exerciseEndTime: e.target.value })}
          className="h-8 text-sm w-24"
          title="结束时间"
        />
        <Select
          value={data.exerciseIntensity}
          onValueChange={(v) => update({ exerciseIntensity: v as "low" | "medium" | "high" })}
        >
          <SelectTrigger className="h-8 text-sm w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">低强度</SelectItem>
            <SelectItem value="medium">中强度</SelectItem>
            <SelectItem value="high">高强度</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** 将 DailyData 转成给 AI 看的文字 */
export function dailyDataToText(data: DailyData): string {
  const parts: string[] = [];
  if (data.weight) parts.push(`今日体重：${data.weight}kg`);
  if (data.exerciseType) {
    let text = `运动：${data.exerciseType}`;
    if (data.exerciseStartTime && data.exerciseEndTime) {
      text += `（${data.exerciseStartTime}—${data.exerciseEndTime}）`;
    }
    const intensity = data.exerciseIntensity === "low" ? "低" : data.exerciseIntensity === "high" ? "高" : "中";
    text += `，${intensity}强度`;
    parts.push(text);
  }
  return parts.join("；");
}
