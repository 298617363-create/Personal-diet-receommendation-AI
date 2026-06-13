import { UserSettings, ExercisePlan } from "./types";

/**
 * BMR（基础代谢率）计算 — Mifflin-St Jeor 公式
 * 单位：kcal/天
 */
export function calculateBMR(
  gender: "male" | "female",
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/** 活动水平系数 */
const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * TDEE（每日总热量消耗）
 * TDEE = BMR × 活动系数
 */
export function calculateTDEE(settings: UserSettings, weightKg: number): number {
  const bmr = calculateBMR(settings.gender, weightKg, settings.height, settings.age);
  return Math.round(bmr * (ACTIVITY_FACTORS[settings.activityLevel] ?? 1.375));
}

/**
 * 运动额外消耗估算（大致值）
 */
export function calculateExerciseBurn(exercise: ExercisePlan): number {
  const metByIntensity: Record<string, number> = {
    low: 4,
    medium: 6,
    high: 9,
  };
  // 粗略公式：MET × 体重(70kg参考) × 时间(h)
  const met = metByIntensity[exercise.intensity] ?? 5;
  const hours = exercise.duration / 60;
  return Math.round(met * 70 * hours);
}

/**
 * 减脂日目标热量
 * TDEE + 运动消耗 - 已吃食物，然后 × 0.8（20% 热量缺口）
 */
export function calculateTargetCalories(
  settings: UserSettings,
  weightKg: number,
  exercise: ExercisePlan,
  alreadyAteCalories: number
): number {
  const tdee = calculateTDEE(settings, weightKg);
  const exerciseBurn = calculateExerciseBurn(exercise);
  const remaining = tdee + exerciseBurn - alreadyAteCalories;
  // 制造 20% 热量缺口，但不能低于 1200 kcal
  const target = Math.round(remaining * 0.8);
  return Math.max(target, 1200);
}
