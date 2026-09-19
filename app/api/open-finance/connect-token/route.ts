import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PluggyClient } from "pluggy-sdk";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clientId = process.env.PLUGGY_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret =
      process.env.PLUGGY_CLIENT_SECRET || process.env.CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret ||
      clientId.includes("seu_client_id") ||
      clientSecret === "***"
    ) {
      return NextResponse.json(
        {
          error:
            "Credenciais da Pluggy (CLIENT_ID e CLIENT_SECRET) não foram inseridas no arquivo .env.",
        },
        { status: 400 },
      );
    }

    const pluggy = new PluggyClient({
      clientId,
      clientSecret,
    });

    const connectToken = await pluggy.createConnectToken(undefined, {
      clientUserId: userId,
    });

    return NextResponse.json({ accessToken: connectToken.accessToken });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao conectar com a Pluggy";
    console.error("Erro ao gerar Pluggy connectToken:", error);
    return NextResponse.json(
      { error: `Falha de comunicação com a Pluggy: ${message}` },
      { status: 500 },
    );
  }
}
