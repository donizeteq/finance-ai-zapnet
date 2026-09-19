/**
 * Sanitização e Validação Estrita de Uploads de Comprovantes
 * ZapTech Finance AI — Segurança de Aplicação (DevSecOps)
 */

export interface FileValidationResult {
  isValid: boolean;
  sanitizedFilename: string;
  detectedMimeType: string;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Max

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

/**
 * Valida os Magic Bytes (Assinatura Binária do Arquivo)
 */
function detectMagicBytesMime(buffer: Uint8Array): string | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Sanitiza o nome do arquivo prevenindo Path Traversal e Executáveis Maliciosos
 */
export function sanitizeFilename(originalName: string): string {
  // Remove caminhos, barras e nulos
  const basename = originalName.replace(/^.*[\\/]/, "").replace(/\0/g, "");

  // Substitui caracteres especiais por underscore, mantendo letras, números, ponto, hífen e underline
  const safeName = basename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Garante extensão única e segura
  const parts = safeName.split(".");
  if (parts.length < 2) return `${safeName}.bin`;

  const ext = parts.pop()!.toLowerCase();
  const nameWithoutExt = parts.join("_");

  return `${nameWithoutExt}.${ext}`;
}

/**
 * Validação Completa de Comprovantes (MIME, Extension & Magic Bytes)
 */
export function validateComprovanteFile(
  bufferInput: ArrayBuffer | Uint8Array | Buffer,
  originalName: string,
  reportedMimeType: string,
): FileValidationResult {
  const buffer = new Uint8Array(bufferInput);

  // 1. Validação de Tamanho
  if (buffer.length === 0) {
    return {
      isValid: false,
      sanitizedFilename: "",
      detectedMimeType: "",
      error: "Arquivo vazio enviado.",
    };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      sanitizedFilename: "",
      detectedMimeType: "",
      error: `Tamanho excede o limite máximo permitido de 5MB (${(buffer.length / 1024 / 1024).toFixed(2)}MB).`,
    };
  }

  // 2. Validação de Extensão
  const sanitized = sanitizeFilename(originalName);
  const ext = sanitized.split(".").pop()?.toLowerCase() || "";

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      sanitizedFilename: sanitized,
      detectedMimeType: "",
      error: `Extensão .${ext} não é permitida. Apenas PDF, JPG, PNG e WEBP são aceitos.`,
    };
  }

  // 3. Validação de Magic Bytes (Assinatura Binária Real)
  const detectedMime = detectMagicBytesMime(buffer);

  if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
    return {
      isValid: false,
      sanitizedFilename: sanitized,
      detectedMimeType: detectedMime || "unknown",
      error:
        "O conteúdo real do arquivo não corresponde a um PDF ou imagem válidos. Upload rejeitado por segurança.",
    };
  }

  // 4. Verificação de Coerência (MIME-Type Reportado vs Real)
  if (reportedMimeType && !ALLOWED_MIME_TYPES.has(reportedMimeType)) {
    return {
      isValid: false,
      sanitizedFilename: sanitized,
      detectedMimeType: detectedMime,
      error: `MIME-Type reportado '${reportedMimeType}' é inválido ou suspeito.`,
    };
  }

  return {
    isValid: true,
    sanitizedFilename: sanitized,
    detectedMimeType: detectedMime,
  };
}
