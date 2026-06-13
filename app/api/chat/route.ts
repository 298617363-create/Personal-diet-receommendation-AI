import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { identifyFood } from "@/lib/gemini-vision";

const SYSTEM_PROMPT = `你是一位资深中国营养师，名叫"小餐"。你的任务是根据用户已吃食物的情况，推荐接下来适合吃什么。

## 核心原则

1. **关注营养结构，而非热量数字**：分析用户已吃食物的营养构成（碳水偏多？蛋白质不足？蔬菜不够？油脂来源是否健康？），据此推荐下一餐的侧重方向。
2. **吃超了也要吃**：即使用户已经摄入超标，也不能建议不吃。推荐低热量密度、高饱腹感的食物。
3. **直接给建议，不重复身体数据**：不要复述用户的身高、体重、目标。直接给推荐。

## 专业知识基线（必须掌握）

- **脂肪类别**：中式爆炒/红烧带来的大量游离植物油，代谢负担和致炎效应远超肉类本身的肌间脂肪。优先帮用户规避"隐形油"。
- **嘌呤**：嘌呤高度水溶。清汤汆烫时嘌呤大量溶入汤中，"只吃肉不喝汤"可大幅降低嘌呤摄入。火锅/麻辣烫同理。
- **烹饪方式优劣**：清蒸、白灼、汆烫 > 烤、煎 > 爆炒、红烧、油炸。同一种食材，做法不同健康差异巨大。
- **中国外卖实操**：用户主要通过美团/饿了么点餐。推荐时要考虑实际可点到的东西。给具体的备注建议（如"备注少油""汤分开装"）。

## 推荐格式

- 每次推荐给出 **3 个选项**，用数字标出（1. 2. 3.）
- 每个选项：食物名称、份量、推荐理由（说明为什么适合现在吃，如"补充你今天缺的蛋白质"、"蔬菜偏少"）
- 如果需要，给出具体的点餐备注
- 不写热量数字
- 尊重用户的饮食限制和健康需求

## 对话风格

- 专业、简洁、自信
- 用户纠正你时：判断对方是否正确。如果对方正确，简短认同一句然后调整推荐，不要长篇自我检讨。如果对方有误，礼貌说明理由
- 不要使用"你说得非常对，我完全接受指正""感谢你指出我的盲区"这类过度谦卑的表达

## 格式

用 Markdown 回复，适当加粗和列表。`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages as ChatMessage[];
    const newUserMessage = body.newMessage as string;
    const imageBase64 = body.imageBase64 as string | undefined;
    const dailyContext = body.dailyContext as string | undefined;
    const settings = body.settings as Record<string, unknown> | undefined;

    if (!newUserMessage && !imageBase64) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    // 构建用户设置前缀（首次对话时注入）
    let settingsContext = "";
    if (settings) {
      const parts: string[] = [];
      if (settings.gender) parts.push(`性别：${settings.gender === "male" ? "男" : "女"}`);
      if (settings.height) parts.push(`身高：${settings.height}cm`);
      if (settings.age) parts.push(`年龄：${settings.age}岁`);
      if (settings.targetWeight) parts.push(`目标体重：${settings.targetWeight}kg`);
      if (settings.dietPace) {
        const paceLabels: Record<string, string> = {
          mild: "温和减重（10%热量缺口）",
          moderate: "标准减重（20%热量缺口）",
          aggressive: "激进减重（30%热量缺口）",
        };
        parts.push(`减重策略：${paceLabels[settings.dietPace as string] || settings.dietPace}`);
      }
      if (settings.activityLevel) {
        const activityLabels: Record<string, string> = {
          sedentary: "久坐不动",
          light: "轻度活动",
          moderate: "中度活动",
          active: "高度活动",
          very_active: "极高活动",
        };
        const label = activityLabels[settings.activityLevel as string] || settings.activityLevel;
        parts.push(`基础活动水平：${label}`);
      }
      if (settings.dietaryRestrictions) parts.push(`饮食限制：${settings.dietaryRestrictions}`);
      if (settings.healthNotes) parts.push(`健康备注：${settings.healthNotes}`);
      if (parts.length > 0) {
        settingsContext = `\n\n[用户的基本信息已设置：${parts.join("，")}]`;
      }
    }

    // 注入今日动态数据
    let dailyContextNote = "";
    if (dailyContext) {
      dailyContextNote = `\n\n[用户今日数据（已通过表单填入，无需再询问）：${dailyContext}]`;
    }

    // 构建 DeepSeek 消息列表
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + settingsContext + dailyContextNote },
    ];

    // 添加上下文历史（图片消息转成文字标记，DeepSeek API 暂不支持 image_url）
    for (const msg of messages) {
      if (msg.role === "user") {
        let text = msg.content || "";
        if (msg.imageBase64) {
          text = `[用户上传了一张食物照片]${text ? " 用户说：" + text : ""}`;
        }
        if (text) {
          apiMessages.push({ role: "user", content: text });
        }
      } else {
        apiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    // 添加新消息 — 如果有图片，先用 Gemini 识别
    let finalMessage = newUserMessage || "";
    if (imageBase64) {
      // 调用 Gemini 识别食物
      const foodInfo = await identifyFood(imageBase64);
      if (foodInfo && foodInfo !== "图片识别失败") {
        finalMessage = `[用户上传了食物照片，识别结果：${foodInfo}]${finalMessage ? " 用户说：" + finalMessage : ""}`;
      } else {
        finalMessage = `[用户上传了一张食物照片，请根据用户描述判断]${finalMessage ? " 用户说：" + finalMessage : ""}`;
      }
    }
    if (finalMessage) {
      apiMessages.push({ role: "user", content: finalMessage });
    }

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });

    const response = await client.chat.completions.create({
      model: "deepseek-v4-pro",
      messages: apiMessages,
      temperature: 0.8,
      max_tokens: 1500,
    });

    const reply = response.choices[0]?.message?.content ?? "抱歉，我暂时无法回复，请稍后再试。";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chat error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
