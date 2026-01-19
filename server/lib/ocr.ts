import { createWorker } from "tesseract.js";
import { ObjectStorageService } from "../replit_integrations/object_storage";
import axios from "axios";

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

    // Initialize Tesseract worker
    const worker = await createWorker(['eng']);
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    if (!text || text.trim().length === 0) {
      return "لم يتم العثور على بيانات نصية في الصورة";
    }

    // Attempt to find MRZ lines
    const lines = text.split('\n').map(l => l.trim().replace(/\s/g, '')).filter(l => l.length >= 30);
    const mrzLines = lines.filter(line => /^[A-Z0-9<]{30,}$/.test(line));

    if (mrzLines.length >= 2) {
      try {
        const { parse } = await import('mrz');
        const result = parse(mrzLines);
        if (result && result.fields) {
          const f = result.fields;
          return `الاسم: ${f.firstName} ${f.lastName}\nالجنس: ${f.sex === 'male' ? 'ذكر' : 'أنثى'}\nرقم الجواز: ${f.documentNumber}\nتاريخ الانتهاء: ${f.expirationDate}\nالجنسية: ${f.nationality}\nالرقم الوطني: ${f.optional1 || 'غير متوفر'}`;
        }
      } catch (e) {
        console.error("MRZ Parsing Error:", e);
      }
    }

    // Clean up and format the text a bit if MRZ parsing fails
    return text.split('\n').filter(line => line.trim().length > 0).join('\n');
  } catch (error: any) {
    console.error("Local OCR Extraction Error:", error);
    return "خطأ في استخراج البيانات برمجياً: يرجى مراجعة الجواز يدوياً.";
  }
}
