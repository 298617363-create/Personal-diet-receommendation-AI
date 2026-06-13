import OpenAI from "openai";
import { UserSettings, DailyInput, MealPlan, FoodAnalysis, MealVerification } from "./types";

const MODEL = "deepseek-chat";

/** 延迟初始化客户端，确保运行时能读到环境变量 */
function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
}

// ===== 1. 生成三餐推荐 =====

export async function generateMealPlan(
  settings: UserSettings,
  dailyInput: DailyInput,
  targetCalories: number
): Promise<MealPlan> {
  const prompt = buildMealPlanPrompt(settings, dailyInput, targetCalories);

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseMealPlan(text, targetCalories);
}

function buildMealPlanPrompt(
  settings: UserSettings,
  dailyInput: DailyInput,
  targetCalories: number
): string {
  return `你是一位专业的中国营养师，请根据以下信息为客户生成今日剩余三餐的推荐。

【客户基本信息】
- 性别：${settings.gender === "male" ? "男" : "女"}
- 身高：${settings.height}cm
- 年龄：${settings.age}岁
- 活动水平：${settings.activityLevel}
${settings.dietaryRestrictions ? `- 饮食限制：${settings.dietaryRestrictions}` : ""}
${settings.healthNotes ? `- 健康备注：${settings.healthNotes}` : ""}

【今日情况】
- 今日体重：${dailyInput.todayWeight}kg
- 运动计划：${dailyInput.exercise.type}，${dailyInput.exercise.duration}分钟，强度${dailyInput.exercise.intensity}
- 已吃食物：${dailyInput.alreadyAte.description || "无"}

【热量预算】
- 今日剩余可用热量：${targetCalories}kcal
- 早餐约占 30%、午餐约占 40%、晚餐约占 30%

【重要要求】
1. 所有推荐食物必须是中国人能在外卖平台（美团、饿了么）上轻松点到的。
2. 优先考虑好吃、有满足感的食物，在热量允许下安排一些"幸福感"食物。
3. 每餐给出具体的食物名称和份量，并估算热量和蛋白质。
4. 如果客户有饮食限制或健康备注，严格遵守。

请严格按以下 JSON 格式返回（不要包含其他文字）：
{
  "breakfast": [
    { "name": "食物名", "portion": "份量", "calories": 数字, "protein": 数字, "reason": "推荐理由" }
  ],
  "lunch": [
    { "name": "食物名", "portion": "份量", "calories": 数字, "protein": 数字, "reason": "推荐理由" }
  ],
  "dinner": [
    { "name": "食物名", "portion": "份量", "calories": 数字, "protein": 数字, "reason": "推荐理由" }
  ],
  "notes": "整体饮食建议，一句话"
}`;
}

function parseMealPlan(jsonText: string, targetCalories: number): MealPlan {
  try {
    // 尝试提取 JSON（处理可能的 markdown 包裹）
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]);

    const breakfast = parsed.breakfast || [];
    const lunch = parsed.lunch || [];
    const dinner = parsed.dinner || [];
    const allMeals = [...breakfast, ...lunch, ...dinner];
    const totalCalories = allMeals.reduce(
      (sum: number, m: { calories: number }) => sum + (m.calories || 0),
      0
    );

    return {
      breakfast,
      lunch,
      dinner,
      targetCalories,
      totalCalories,
      remainingBudget: targetCalories - totalCalories,
      notes: parsed.notes || "",
    };
  } catch {
    return {
      breakfast: [],
      lunch: [],
      dinner: [],
      targetCalories,
      totalCalories: 0,
      remainingBudget: targetCalories,
      notes: "AI 返回格式异常，请重试",
    };
  }
}

// ===== 2. 识别食物图片 =====

export async function analyzeFoodImage(imageBase64: string): Promise<FoodAnalysis> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "请识别这张图片中的食物，给出食物名称和估算热量(kcal)。以JSON格式返回：{\"foodName\":\"食物名\",\"estimatedCalories\":数字,\"confidence\":\"high/medium/low\"}。不要包含其他文字。",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  } catch {
    return { foodName: "无法识别", estimatedCalories: 0, confidence: "low" };
  }
}

// ===== 3. 验证外卖照片是否匹配推荐 =====

export async function verifyMealImage(
  imageBase64: string,
  recommendation: string
): Promise<MealVerification> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `以下是给你的三餐推荐：\n${recommendation}\n\n请对比这张外卖照片，判断实际食物是否符合推荐。\n以 JSON 格式返回：{"verdict":"match/partial/mismatch","analysis":"具体分析","suggestions":"改进建议"}。\n- match: 完全或基本符合推荐\n- partial: 部分符合，有出入但方向正确\n- mismatch: 严重偏离推荐，热量或种类差距大\n不要包含其他文字。`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const text = response.choices[0]?.message?.content ?? "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  } catch {
    return {
      verdict: "partial",
      analysis: "AI 分析异常，请手动判断",
      suggestions: "建议对照推荐内容自行检查",
    };
  }
}

/** 将 MealPlan 转为给验证用的文字摘要 */
export function mealPlanToText(plan: MealPlan): string {
  const mealText = (label: string, meals: { name: string; portion: string; calories: number }[]) =>
    `${label}：` + meals.map((m) => `${m.name}（${m.portion}，约${m.calories}kcal）`).join("、");

  return [
    mealText("早餐", plan.breakfast),
    mealText("午餐", plan.lunch),
    mealText("晚餐", plan.dinner),
    `目标热量：${plan.targetCalories}kcal，三餐合计：${plan.totalCalories}kcal`,
    plan.notes,
  ].join("\n");
}
