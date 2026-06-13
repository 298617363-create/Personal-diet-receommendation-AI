import { NextRequest, NextResponse } from "next/server";
import { verifyMealImage } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const recommendation = formData.get("recommendation") as string | null;

    if (!file) {
      return NextResponse.json({ error: "请上传图片" }, { status: 400 });
    }
    if (!recommendation) {
      return NextResponse.json({ error: "缺少推荐内容" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await verifyMealImage(base64, recommendation);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verify meal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
