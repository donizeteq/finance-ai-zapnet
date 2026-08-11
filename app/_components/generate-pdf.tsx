"use client";

import { jsPDF } from "jspdf";

interface GeneratePdfProps {
  report: string | null;
}

const GeneratePdf = ({ report }: GeneratePdfProps) => {
  if (!report || typeof report !== "string") {
    return null;
  }

  const handleDownload = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const maxWidth = pageWidth - margin * 2;

      // === CABEÇALHO ===
      doc.setFillColor(34, 197, 94); // verde
      doc.rect(0, 0, pageWidth, 6, "F");

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Relatorio Financeiro", margin, 50);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Data de Geracao: ${new Date().toLocaleDateString("pt-BR")}`,
        margin,
        70,
      );

      // Linha separadora
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, 85, pageWidth - margin, 85);

      // === CORPO DO RELATORIO ===
      doc.setTextColor(40, 40, 40);
      let y = 110;

      // Divide o relatorio em paragrafos (separados por \n ou duplo espaco)
      const paragraphs = report.split(/\n+/);

      for (const para of paragraphs) {
        const cleanPara = para.trim();
        if (!cleanPara) {
          y += 10;
          continue;
        }

        // Titulos (linhas curtas com negrito detectadas por ** ou #)
        const isHeading = /^#{1,3}\s|^\*\*[^*]+\*\*$/.test(cleanPara);
        const cleanText = cleanPara
          .replace(/^#{1,3}\s/, "")
          .replace(/\*\*/g, "");

        if (isHeading) {
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(20, 20, 20);
        } else {
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
        }

        const lines = doc.splitTextToSize(cleanText, maxWidth);

        for (const line of lines) {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
            // Repete cabecalho leve nas novas paginas
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150, 150, 150);
            doc.text("Relatorio Financeiro - Finance.ai", margin, margin - 10);
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(11);
            y += 10;
          }
          doc.text(line, margin, y);
          y += isHeading ? 20 : 16;
        }
      }

      // === RODAPE ===
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text(
          `Finance.ai - Pagina ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" },
        );
      }

      doc.save("relatorio_financeiro.pdf");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="text-sm font-medium text-primary hover:underline"
    >
      Baixar PDF
    </button>
  );
};

export default GeneratePdf;
