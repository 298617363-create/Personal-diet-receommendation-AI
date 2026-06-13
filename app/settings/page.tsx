"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserSettings, DEFAULT_SETTINGS, ActivityLevel, DietPace } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "久坐不动（几乎不运动）",
  light: "轻度活动（每周 1-3 天）",
  moderate: "中度活动（每周 3-5 天）",
  active: "高度活动（每周 6-7 天）",
  very_active: "极高活动（运动员/体力劳动）",
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>个人设置</CardTitle>
          <CardDescription>
            这些参数基本不变，设置一次即可。随时可以修改。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 性别 */}
          <div className="space-y-2">
            <Label>性别</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  checked={settings.gender === "male"}
                  onChange={() => setSettings({ ...settings, gender: "male" })}
                />
                男
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  checked={settings.gender === "female"}
                  onChange={() => setSettings({ ...settings, gender: "female" })}
                />
                女
              </label>
            </div>
          </div>

          {/* 身高 */}
          <div className="space-y-2">
            <Label htmlFor="height">身高 (cm)</Label>
            <Input
              id="height"
              type="number"
              value={settings.height}
              onChange={(e) =>
                setSettings({ ...settings, height: Number(e.target.value) || 0 })
              }
            />
          </div>

          {/* 年龄 */}
          <div className="space-y-2">
            <Label htmlFor="age">年龄</Label>
            <Input
              id="age"
              type="number"
              value={settings.age}
              onChange={(e) =>
                setSettings({ ...settings, age: Number(e.target.value) || 0 })
              }
            />
          </div>

          {/* 目标体重 */}
          <div className="space-y-2">
            <Label htmlFor="targetWeight">目标体重 (kg)</Label>
            <Input
              id="targetWeight"
              type="number"
              placeholder="你想到达的体重"
              value={settings.targetWeight}
              onChange={(e) =>
                setSettings({ ...settings, targetWeight: Number(e.target.value) || 0 })
              }
            />
          </div>

          {/* 减重速度 */}
          <div className="space-y-2">
            <Label>减重速度</Label>
            <Select
              value={settings.dietPace}
              onValueChange={(v) =>
                setSettings({ ...settings, dietPace: v as DietPace })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">温和（10% 热量缺口，慢慢来）</SelectItem>
                <SelectItem value="moderate">标准（20% 热量缺口，推荐）</SelectItem>
                <SelectItem value="aggressive">激进（30% 热量缺口，需要毅力）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 活动水平 */}
          <div className="space-y-2">
            <Label>活动水平</Label>
            <Select
              value={settings.activityLevel}
              onValueChange={(v) =>
                setSettings({ ...settings, activityLevel: v as ActivityLevel })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ACTIVITY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 饮食限制 */}
          <div className="space-y-2">
            <Label htmlFor="restrictions">饮食限制</Label>
            <Textarea
              id="restrictions"
              placeholder="如：不吃辣、不吃海鲜、清真、不吃猪肉…"
              value={settings.dietaryRestrictions}
              onChange={(e) =>
                setSettings({ ...settings, dietaryRestrictions: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* 健康备注 */}
          <div className="space-y-2">
            <Label htmlFor="health">健康备注</Label>
            <Textarea
              id="health"
              placeholder="如：高尿酸、糖尿病前期、高血压…"
              value={settings.healthNotes}
              onChange={(e) =>
                setSettings({ ...settings, healthNotes: e.target.value })
              }
              rows={2}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            {saved ? "已保存 ✓" : "保存设置"}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push("/")}
      >
        返回首页
      </Button>
    </div>
  );
}
