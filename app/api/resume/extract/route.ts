import {
  apiError,
  ApiError,
  requireUser,
  sameOrigin,
} from "@/lib/helper-server";
import { PDFParse } from "pdf-parse";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await requireUser();
    if (Number(req.headers.get("content-length") || 0) > 5.3 * 1024 * 1024)
      throw new ApiError(413, "Files must be 5 MB or smaller");
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      throw new ApiError(400, "Choose a PDF or TXT file no larger than 5 MB.");
    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    let text = "";
    if (file.name.toLowerCase().endsWith(".pdf")) {
      if (buffer.subarray(0, 5).toString() !== "%PDF-")
        throw new ApiError(400, "Invalid PDF file.");
      const parser = new PDFParse({ data: buffer, isEvalSupported: false });
      try {
        text = (await parser.getText({ first: 20 })).text;
      } catch {
        throw new ApiError(
          400,
          "Unable to read this PDF. Use an unencrypted text-based PDF or paste the text.",
        );
      } finally {
        await parser.destroy();
      }
    } else if (file.name.toLowerCase().endsWith(".txt"))
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    else throw new ApiError(400, "Only PDF and TXT files are supported.");
    if (text.trim().length < 80)
      throw new ApiError(
        400,
        "Not enough text could be extracted. Run OCR on scanned PDFs or paste the text manually.",
      );
    if (text.length > 30000)
      throw new ApiError(
        400,
        "The resume exceeds 30,000 characters. Shorten it before uploading.",
      );
    return Response.json({ text });
  } catch (e) {
    return apiError(e);
  }
}
