import { NextResponse } from "next/server";
import { validateComprovanteFile } from "@/app/_lib/file-sanitizer";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado no formulário." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const validation = validateComprovanteFile(
      arrayBuffer,
      file.name,
      file.type,
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error,
          code: "INVALID_FILE_SECURITY",
        },
        { status: 400 },
      );
    }

    // Retorna a confirmação de validação estrita com sucesso
    return NextResponse.json({
      success: true,
      message: "Comprovante validado e aprovado com sucesso.",
      filename: validation.sanitizedFilename,
      mimeType: validation.detectedMimeType,
      sizeBytes: arrayBuffer.byteLength,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro interno no servidor ao processar o upload do comprovante.",
      },
      { status: 500 },
    );
  }
}
