import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.includes("填在这里")) {
    return NextResponse.json(
      { error: "请先在 .env.local 中填入你的 DEEPSEEK_API_KEY" },
      { status: 400 }
    );
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "user", content: "请回复'连接成功'这两个词，不要其他内容。" },
      ],
      max_tokens: 20,
    });

    const text = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      reply: text,
      model: response.model,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
