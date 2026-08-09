import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background text-center text-foreground">
      <h2 className="text-2xl font-bold">Página não encontrada</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
