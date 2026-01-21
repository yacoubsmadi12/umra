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
    const rawLines = text.split('\n').map(l => l.trim());
    const cleanedLines = rawLines.map(line => line.replace(/\s/g, '').replace(/O/g, '0'));
    
    // Find lines that look like MRZ (TD3 is 44, TD1 is 30)
    const mrzLines = cleanedLines.filter(line => /^[A-Z0-9<]{30,}$/.test(line));

    if (mrzLines.length >= 2) {
      try {
        const { parse } = await import('mrz');
        
        // Try to find a valid sequence of MRZ lines
        // For TD3 (2 lines), TD2 (2 lines), or TD1 (3 lines)
        let result = null;
        
        // Try 3 lines first (TD1)
        if (mrzLines.length >= 3) {
          for (let i = 0; i <= mrzLines.length - 3; i++) {
            try {
              result = parse(mrzLines.slice(i, i + 3));
              if (result && result.valid) break;
            } catch (e) {}
          }
        }
        
        // Try 2 lines (TD3/TD2) if 3 lines didn't work
        if (!result || !result.valid) {
          for (let i = 0; i <= mrzLines.length - 2; i++) {
            try {
              result = parse(mrzLines.slice(i, i + 2));
              if (result && result.valid) break;
            } catch (e) {}
          }
        }

        // If still no valid result, take the last 2 lines as a fallback
        if (!result) {
          try {
            result = parse(mrzLines.slice(-2));
          } catch (e) {}
        }

        if (result && result.fields) {
          const f = result.fields;
          // Combine firstName and lastName to get full name
          // MRZ firstName usually contains middle names separated by <
          const fullName = [f.firstName, f.lastName].filter(Boolean).join(' ').replace(/</g, ' ').trim();
          
          // Format date of birth: YYMMDD to YYYY-MM-DD
          let dob = f.birthDate || 'غير متوفر';
          if (dob !== 'غير متوفر' && dob.length === 6) {
            const yearPrefix = parseInt(dob.substring(0, 2)) > 25 ? '19' : '20';
            dob = `${yearPrefix}${dob.substring(0, 2)}-${dob.substring(2, 4)}-${dob.substring(4, 6)}`;
          }

          return `رقم الجواز: ${f.documentNumber || 'غير متوفر'}\n` +
                 `اسم صاحب الجواز: ${fullName || 'غير متوفر'}\n` +
                 `تاريخ الميلاد: ${dob}\n` +
                 `الجنس: ${f.sex === 'male' ? 'ذكر' : f.sex === 'female' ? 'أنثى' : 'غير واضح'}\n` +
                 `الرقم الوطني: ${f.personalNumber || 'غير متوفر'}\n` +
                 `تاريخ الانتهاء: ${f.expirationDate || 'غير متوفر'}`;
        }
      } catch (e) {
        console.error("MRZ Parsing Error:", e);
      }
    }

    // Fallback: If MRZ parsing fails, try to extract some basic info using regex
    const passportNoMatch = text.match(/[A-Z][0-9]{6,8}/);
    // Adjusted name regex to be more inclusive
    const nameMatch = text.match(/[A-Z]{2,}(\s[A-Z]{2,})+/);
    
    if (passportNoMatch || nameMatch) {
      return `رقم الجواز: ${passportNoMatch ? passportNoMatch[0] : 'غير واضح'}\n` +
             `اسم صاحب الجواز: ${nameMatch ? nameMatch[0] : 'غير واضح'}\n` +
             `تاريخ الميلاد: غير واضح\n` +
             `الجنس: غير واضح\n` +
             `الرقم الوطني: غير واضح\n` +
             `تاريخ الانتهاء: غير واضح\n\n` +
             `ملاحظة: لم يتم التعرف على كافة البيانات تلقائياً، يرجى تعبئتها يدوياً.`;
    }

    return "لم يتم التعرف على صيغة الجواز (MRZ) بدقة. يرجى التأكد من وضوح الصورة ومراجعة البيانات يدوياً.";
  } catch (error: any) {
    console.error("Local OCR Extraction Error:", error);
    return "خطأ في استخراج البيانات برمجياً: يرجى مراجعة الجواز يدوياً.";
  }
}
