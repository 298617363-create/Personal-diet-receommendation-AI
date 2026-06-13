import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 未设置");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * 识别食物图片，返回文字描述
 * @param imageBase64 图片的 base64 数据（不含 data:xxx;base64, 前缀）
 * @param mimeType 图片 MIME 类型，默认 image/jpeg
 * @returns 食物名称和估算热量
 */
export async function identifyFood(
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<string> {
  try {
    const model = getModel();

    const result = await model.generateContent([
      {
        inlineData: { data: imageBase64, mimeType },
      },
      {
        text: "请识别这张图片中的食物，给出食物名称和估算热量。直接返回简短结果，格式如：食物名称，约XXX kcal。如果是外卖订单截图，请提取其中的食物名称。",
      },
    ]);

    const text = result.response.text();
    return text || "未能识别食物";
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Gemini vision error:", msg);
    return "图片识别失败";
  }
}
