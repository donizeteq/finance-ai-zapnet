"use client"; // Certifique-se de que este arquivo é um componente do lado do cliente

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  BlobProvider,
} from "@react-pdf/renderer";

interface GeneratePdfProps {
  report: string | null; // Define o tipo da propriedade report
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 20,
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
  },
});

const MyDocument = ({ report }: { report: string | null }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Relatório Financeiro</Text>
        <Text style={styles.text}>
          Data de Geração: {new Date().toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Resumo Financeiro</Text>
        <Text style={styles.text}>
          {report || "Nenhum relatório disponível."}
        </Text>
      </View>
    </Page>
  </Document>
);

const GeneratePdf = ({ report }: GeneratePdfProps) => {
  if (!report || typeof report !== "string") {
    return null;
  }

  return (
    <BlobProvider document={<MyDocument report={report} />}>
      {({ url, loading, error }) => (
        <a href={url || ""} download="relatorio_financeiro.pdf">
          {error
            ? "Erro ao gerar PDF"
            : loading
              ? "Gerando PDF..."
              : "Baixar PDF"}
        </a>
      )}
    </BlobProvider>
  );
};

export default GeneratePdf;
