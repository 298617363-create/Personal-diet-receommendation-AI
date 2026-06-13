import { MealPlan } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  plan: MealPlan;
}

export default function MealPlanView({ plan }: Props) {
  return (
    <div className="space-y-4">
      {/* 热量概览 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">今日热量概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>目标热量</span>
            <span className="font-semibold">{plan.targetCalories} kcal</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>三餐合计</span>
            <span className="font-semibold">{plan.totalCalories} kcal</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>剩余预算</span>
            <span className={plan.remainingBudget >= 0 ? "text-green-600" : "text-red-600"}>
              {plan.remainingBudget >= 0 ? "+" : ""}{plan.remainingBudget} kcal
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 早餐 */}
      <MealCard label="🌅 早餐" meals={plan.breakfast} />

      {/* 午餐 */}
      <MealCard label="🌞 午餐" meals={plan.lunch} />

      {/* 晚餐 */}
      <MealCard label="🌙 晚餐" meals={plan.dinner} />

      {/* 建议 */}
      {plan.notes && (
        <p className="text-sm text-muted-foreground text-center italic px-4">
          💡 {plan.notes}
        </p>
      )}
    </div>
  );
}

function MealCard({
  label,
  meals,
}: {
  label: string;
  meals: { name: string; portion: string; calories: number; protein: number; reason: string }[];
}) {
  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between">
          <span>{label}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalCal} kcal · {totalProtein}g 蛋白质
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无推荐</p>
        ) : (
          <ul className="space-y-2">
            {meals.map((m, i) => (
              <li key={i} className="border-b last:border-0 pb-2 last:pb-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {m.portion} · {m.calories}kcal
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
