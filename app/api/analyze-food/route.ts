import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodImage } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请上传图片" }, { status: 400 });
    }

    // 将图片转为 base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // 调用 DeepSeek 识别
    const result = await analyzeFoodImage(base64);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Analyze food error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
