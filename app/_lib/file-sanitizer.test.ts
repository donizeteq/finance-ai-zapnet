import { validateComprovanteFile, sanitizeFilename } from "./file-sanitizer";

describe("Sanitização de Uploads e Validação de Comprovantes", () => {
  test("Deve sanitizar nomes de arquivos com Path Traversal", () => {
    const dangerousName = "../../../etc/passwd.pdf";
    const sanitized = sanitizeFilename(dangerousName);
    expect(sanitized).not.toContain("/");
    expect(sanitized).not.toContain("..");
    expect(sanitized).toBe("______etc_passwd.pdf");
  });

  test("Deve aceitar um PDF autêntico com Magic Bytes %PDF-", () => {
    // Magic Bytes de PDF: 0x25, 0x50, 0x44, 0x46
    const pdfBuffer = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x31, 0x2e, 0x35,
    ]);
    const result = validateComprovanteFile(
      pdfBuffer,
      "comprovante_pix.pdf",
      "application/pdf",
    );
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe("application/pdf");
  });

  test("Deve rejeitar um falso PDF (script/texto renomeado para .pdf)", () => {
    // Conteúdo de texto simples (falso PDF)
    const fakePdfBuffer = new Uint8Array(Buffer.from("echo 'hacked'"));
    const result = validateComprovanteFile(
      fakePdfBuffer,
      "comprovante_fake.pdf",
      "application/pdf",
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("conteúdo real do arquivo não corresponde");
  });

  test("Deve rejeitar arquivos acima do limite de 5MB", () => {
    const hugeBuffer = new Uint8Array(6 * 1024 * 1024); // 6MB
    hugeBuffer.set([0x25, 0x50, 0x44, 0x46]); // Magic bytes validos, mas tamanho excessivo
    const result = validateComprovanteFile(
      hugeBuffer,
      "grade.pdf",
      "application/pdf",
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Tamanho excede o limite");
  });
});
