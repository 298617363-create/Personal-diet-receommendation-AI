"use client";

import { useState, useRef } from "react";
import { DailyInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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

interface Props {
  onSubmit: (dailyInput: DailyInput, alreadyAteCalories: number) => void;
  loading: boolean;
}

export default function DailyInputForm({ onSubmit, loading }: Props) {
  const [todayWeight, setTodayWeight] = useState("");
  const [exerciseType, setExerciseType] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");
  const [exerciseIntensity, setExerciseIntensity] = useState<"low" | "medium" | "high">("medium");
  const [alreadyAteDesc, setAlreadyAteDesc] = useState("");
  const [alreadyAteCalories, setAlreadyAteCalories] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [foodPreview, setFoodPreview] = useState<string | null>(null);
  const [foodBase64, setFoodBase64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** 拍照或选择图片后，调用 AI 识别食物 */
  async function handleAnalyzeFood() {
    if (!foodBase64) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      // 把 base64 转回 blob 上传
      const byteChars = atob(foodBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNums)], { type: "image/jpeg" });
      formData.append("image", blob, "food.jpg");

      const res = await fetch("/api/analyze-food", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("识别失败");

      const data = await res.json();
      const desc = alreadyAteDesc
        ? `${alreadyAteDesc}；图片识别：${data.foodName}（约${data.estimatedCalories}kcal）`
        : `${data.foodName}（约${data.estimatedCalories}kcal）`;

      setAlreadyAteDesc(desc);
      // 如果用户没填热量，自动填入识别结果
      if (!alreadyAteCalories && data.estimatedCalories) {
        setAlreadyAteCalories(String(data.estimatedCalories));
      }
    } catch {
      // 识别失败不阻塞，用户可以继续手动填
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFoodBase64(result.split(",")[1]);
      setFoodPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    const dailyInput: DailyInput = {
      todayWeight: parseFloat(todayWeight) || 70,
      exercise: {
        type: exerciseType || "休息日",
        duration: parseInt(exerciseDuration) || 0,
        intensity: exerciseIntensity,
      },
      alreadyAte: {
        description: alreadyAteDesc,
        ...(foodBase64 ? { imageBase64: foodBase64 } : {}),
      },
    };
    onSubmit(dailyInput, parseInt(alreadyAteCalories) || 0);
  }

  const isValid = todayWeight && parseFloat(todayWeight) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>今日数据</CardTitle>
        <CardDescription>
          填写你今天的情况，AI 会为你推荐剩余三餐。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 今日体重 */}
        <div className="space-y-2">
          <Label htmlFor="weight">今日体重 (kg) *</Label>
          <Input
            id="weight"
            type="number"
            placeholder="如 70"
            value={todayWeight}
            onChange={(e) => setTodayWeight(e.target.value)}
          />
        </div>

        {/* 运动计划 */}
        <div className="space-y-2">
          <Label>今日运动计划</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="运动类型（如慢跑）"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
            />
            <Input
              type="number"
              placeholder="时长（分钟）"
              value={exerciseDuration}
              onChange={(e) => setExerciseDuration(e.target.value)}
            />
          </div>
          <Select
            value={exerciseIntensity}
            onValueChange={(v) => setExerciseIntensity(v as "low" | "medium" | "high")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低强度（散步、瑜伽）</SelectItem>
              <SelectItem value="medium">中强度（慢跑、游泳）</SelectItem>
              <SelectItem value="high">高强度（HIIT、力量训练）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 已吃食物 */}
        <div className="space-y-2">
          <Label htmlFor="ate">今天已经吃了什么</Label>
          <Textarea
            id="ate"
            placeholder="如：早餐吃了两个肉包 + 一杯豆浆"
            value={alreadyAteDesc}
            onChange={(e) => setAlreadyAteDesc(e.target.value)}
            rows={2}
          />
        </div>

        {/* 食物拍照识别 */}
        <div className="space-y-2">
          <Label>拍照识别食物（可选）</Label>
          {foodPreview ? (
            <div className="space-y-2">
              <img
                src={foodPreview}
                alt="食物预览"
                className="w-full rounded-lg max-h-48 object-cover"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFoodPreview(null);
                    setFoodBase64(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  重新选择
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeFood}
                  disabled={analyzing}
                >
                  {analyzing ? "识别中..." : "🔍 AI 识别"}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <p className="text-sm text-muted-foreground">📷 拍照或选择图片识别已吃食物</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ateCal">已吃食物估算热量 (kcal)</Label>
          <Input
            id="ateCal"
            type="number"
            placeholder="如 500"
            value={alreadyAteCalories}
            onChange={(e) => setAlreadyAteCalories(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> AI 正在生成推荐...
            </span>
          ) : (
            "生成今日推荐"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
