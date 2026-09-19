import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";
import { pluggyClient } from "@/app/_lib/pluggy";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const connections = await db.bankConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ connections });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar conexões";
    console.error("Erro ao listar conexões bancárias:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const connection = await db.bankConnection.findFirst({
      where: { id, userId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Conexão não encontrada" },
        { status: 404 },
      );
    }

    try {
      await pluggyClient.deleteItem(connection.itemId);
    } catch (e) {
      console.warn("Aviso ao deletar Item na Pluggy:", e);
    }

    await db.bankConnection.delete({
      where: { id: connection.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir conexão";
    console.error("Erro ao excluir conexão bancária:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
