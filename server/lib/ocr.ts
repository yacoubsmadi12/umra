import OpenAI from "openai";
import { ObjectStorageService } from "../replit_integrations/object_storage";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function extractPassportData(url: string): Promise<string> {
  try {
    // Determine the object path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const objectPath = pathParts.slice(pathParts.indexOf('.private')).join('/');

    // Generate a signed URL for internal access
    const storageService = new ObjectStorageService();
    const signedUrl = await storageService.getSignedUrl(objectPath);

    // Fetch the image using the signed URL
    const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const base64Image = buffer.toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Please extract the following information from this passport image in Arabic: Full Name, Passport Number, Nationality, Date of Birth, and Expiry Date. Format the output as a clean list in Arabic." },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_completion_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "لم يتم العثور على بيانات";
  } catch (error: any) {
    console.error("AI Passport Extraction Error:", error);
    return "خطأ في استخراج البيانات: يرجى مراجعة الجواز يدوياً.";
  }
}
