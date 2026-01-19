import { createWorker } from "tesseract.js";
import { ObjectStorageService } from "../replit_integrations/object_storage";
import axios from "axios";

export async function extractPassportData(url: string): Promise<string> {
  try {
    // Determine the object path from the URL
    const urlObj = new URL(url);
    const objectPath = urlObj.pathname.startsWith('/uploads/') 
      ? urlObj.pathname 
      : urlObj.pathname.split('/').slice(urlObj.pathname.split('/').indexOf('.private')).join('/');

    // Generate a signed URL for internal access
    const storageService = new ObjectStorageService();
    let imageSource: string | Buffer = url;

    // Check if getSignedUrl exists (it might not in local storage setup)
    if (typeof storageService.getSignedUrl === 'function') {
      try {
        const signedUrl = await storageService.getSignedUrl(objectPath);
        const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
        imageSource = Buffer.from(response.data, 'binary');
      } catch (e) {
        console.warn("Failed to get signed URL, falling back to direct URL:", e);
      }
    } else {
      // Fallback for local storage where getSignedUrl might not be available
      // or we can fetch directly if it's a public/local URL
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        imageSource = Buffer.from(response.data, 'binary');
      } catch (e) {
        console.error("Direct fetch failed:", e);
      }
    }

    // Initialize Tesseract worker
    const worker = await createWorker(['eng']);
    const { data: { text } } = await worker.recognize(imageSource);
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
        // Standardize lines to expected lengths (44 for TD3, 30 for TD1, etc)
        const standardizedLines = mrzLines.map(line => {
          if (line.length > 44) return line.substring(0, 44);
          if (line.length > 30 && line.length < 36) return line.substring(0, 30);
          if (line.length > 36 && line.length < 44) return line.substring(0, 36);
          return line;
        });

        const result = parse(standardizedLines);
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
