// ===== 静态参数（存 localStorage，基本不变） =====

export type ActivityLevel =
  | "sedentary"    // 久坐不动
  | "light"        // 轻度活动（每周 1-3 天）
  | "moderate"     // 中度活动（每周 3-5 天）
  | "active"       // 高度活动（每周 6-7 天）
  | "very_active"; // 极高活动（运动员/体力劳动）

export type DietPace =
  | "mild"       // 温和（10% 热量缺口）
  | "moderate"   // 标准（20% 热量缺口）
  | "aggressive"; // 激进（30% 热量缺口）

export interface UserSettings {
  gender: "male" | "female";
  height: number;               // 身高 cm
  age: number;                  // 年龄
  targetWeight: number;         // 目标体重 kg
  dietPace: DietPace;           // 减重速度
  activityLevel: ActivityLevel;
  dietaryRestrictions: string;  // 饮食限制，如"不吃辣、不吃海鲜"
  healthNotes: string;          // 健康备注，如"高尿酸、糖尿病前期"
}

export const DEFAULT_SETTINGS: UserSettings = {
  gender: "male",
  height: 170,
  age: 30,
  targetWeight: 65,
  dietPace: "moderate",
  activityLevel: "light",
  dietaryRestrictions: "",
  healthNotes: "",
};

// ===== 每日动态输入（不保存） =====

export interface ExercisePlan {
  type: string;        // 运动类型，如"慢跑""游泳""力量训练"
  duration: number;    // 时长（分钟）
  intensity: "low" | "medium" | "high";
}

export interface AlreadyAte {
  description: string;    // 文字描述已吃食物
  imageBase64?: string;   // 可选：食物照片的 base64
}

export interface DailyInput {
  todayWeight: number;     // 今日体重 kg
  exercise: ExercisePlan;  // 今日运动计划
  alreadyAte: AlreadyAte;  // 已吃食物
}

// ===== 三餐推荐结果 =====

export interface MealItem {
  name: string;        // 食物名称
  portion: string;     // 份量描述，如"一碗""半份"
  calories: number;    // 估算热量 kcal
  protein: number;     // 蛋白质 g
  reason: string;      // 推荐理由
}

export interface MealPlan {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  targetCalories: number;     // 今日目标热量
  totalCalories: number;      // 三餐合计热量
  remainingBudget: number;    // 已吃食物后的剩余热量预算
  notes: string;              // 整体建议
}

// ===== 食物图片分析结果 =====

export interface FoodAnalysis {
  foodName: string;
  estimatedCalories: number;
  confidence: "high" | "medium" | "low";
}

// ===== 外卖验证结果 =====

export interface MealVerification {
  verdict: "match" | "partial" | "mismatch";
  analysis: string;      // AI 的分析
  suggestions: string;   // 改进建议
}
