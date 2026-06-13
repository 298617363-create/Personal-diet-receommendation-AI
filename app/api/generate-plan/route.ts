import { NextRequest, NextResponse } from "next/server";
import { generateMealPlan } from "@/lib/deepseek";
import { calculateTargetCalories } from "@/lib/calculator";
import { UserSettings, DailyInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = body.settings as UserSettings;
    const dailyInput = body.dailyInput as DailyInput;
    const alreadyAteCalories = body.alreadyAteCalories as number;

    if (!settings || !dailyInput) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 计算目标热量
    const targetCalories = calculateTargetCalories(
      settings,
      dailyInput.todayWeight,
      dailyInput.exercise,
      alreadyAteCalories || 0
    );

    // 调用 DeepSeek 生成推荐
    const mealPlan = await generateMealPlan(settings, dailyInput, targetCalories);

    return NextResponse.json(mealPlan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Generate plan error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
