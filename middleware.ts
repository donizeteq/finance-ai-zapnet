import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define rotas protegidas que requerem autenticação
const isProtectedRoute = createRouteMatcher([
  "/transactions(.*)",
  "/subscription(.*)",
]);

export default clerkMiddleware((auth, request) => {
  const { userId } = auth();

  // Proteção contra ataques de força bruta
  const userAgent = request.headers.get("user-agent");
  if (!userAgent || userAgent.length > 500) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Verificar se é uma rota protegida — usa o redirectToSignIn nativo do Clerk
  if (isProtectedRoute(request) && !userId) {
    return auth().redirectToSignIn({ returnBackUrl: request.url });
  }

  // Headers de segurança
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.stripe.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com wss://*.clerk.accounts.dev",
      "frame-src https://js.stripe.com https://*.clerk.accounts.dev",
      "worker-src 'self' blob:",
    ].join("; "),
  );

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
