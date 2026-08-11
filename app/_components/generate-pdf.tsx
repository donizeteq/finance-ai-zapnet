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
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Financeiro", margin, 60);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`,
        margin,
        80,
      );

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Financeiro", margin, 110);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Quebra o texto em linhas que cabem na página
      const lines = doc.splitTextToSize(report, maxWidth);
      let y = 130;
      const pageHeight = doc.internal.pageSize.getHeight();

      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 16;
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
