import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/saveUpload";

export async function POST(request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "general");

    const url = await saveUploadedFile(file, folder);
    return NextResponse.json({ url });
  } catch (error) {
    const status = error.message === "Forbidden: Admins only" ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
