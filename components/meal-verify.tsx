import { MealVerification } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VERDICT_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  match: { emoji: "✅", label: "符合推荐", color: "text-green-600" },
  partial: { emoji: "⚠️", label: "部分符合", color: "text-amber-600" },
  mismatch: { emoji: "❌", label: "偏离推荐", color: "text-red-600" },
};

interface Props {
  verification: MealVerification;
}

export default function MealVerifyResult({ verification }: Props) {
  const v = VERDICT_MAP[verification.verdict] ?? VERDICT_MAP.partial;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{v.emoji}</span>
          <span className={v.color}>{v.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {verification.analysis && (
          <div>
            <p className="text-sm font-medium mb-1">分析</p>
            <p className="text-sm text-muted-foreground">{verification.analysis}</p>
          </div>
        )}
        {verification.suggestions && (
          <div>
            <p className="text-sm font-medium mb-1">建议</p>
            <p className="text-sm text-muted-foreground">{verification.suggestions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
