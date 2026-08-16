import Image from "next/image";
import { Button } from "../_components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const loginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden md:grid md:h-screen md:grid-cols-2">
      {/* ESQUERDA */}
      <div className="mx-auto flex w-full max-w-[550px] flex-col justify-center p-6 md:h-full md:p-8">
        <Image
          src="/logo.svg"
          width={173}
          height={39}
          alt="Finance AI"
          className="mb-6 md:mb-8"
        />
        <h1 className="mb-2 text-3xl font-bold md:mb-3 md:text-4xl">
          Bem-vindo
        </h1>
        <p className="mb-6 w-full text-sm text-muted-foreground md:mb-8 md:text-base">
          A Finance AI é uma plataforma de gestão financeira que utiliza IA para
          monitorar suas movimentações, e oferecer insights personalizados,
          facilitando o controle do seu orçamento.
        </p>
        <SignInButton mode="modal">
          <Button variant="outline">
            <LogInIcon className="mr-2" />
            Fazer Login ou criar conta
          </Button>
        </SignInButton>
      </div>
      {/* DIREITA — oculta no mobile, visível no desktop */}
      <div className="relative hidden h-full w-full md:block">
        <Image
          src="/login.png"
          alt="Faça login"
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default loginPage;
