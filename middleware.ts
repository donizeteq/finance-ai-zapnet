import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define rotas protegidas que requerem autenticação
const isProtectedRoute = createRouteMatcher([
  '/transactions(.*)',
  '/subscription(.*)',
  '/api/webhooks/stripe(.*)',
]);

// Define rotas públicas que não requerem autenticação
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/api/webhooks/stripe(.*)', // Webhooks do Stripe são públicos mas protegidos por assinatura
]);

export default clerkMiddleware((auth, request) => {
  const { userId } = auth();
  const { pathname } = request.nextUrl;

  // Proteção contra ataques de força bruta
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length > 500) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Verificar se é uma rota protegida
  if (isProtectedRoute(request) && !userId) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteção adicional para webhooks do Stripe
  if (pathname.startsWith('/api/webhooks/stripe')) {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // Headers de segurança
  const response = NextResponse.next();
  
  // Proteção contra clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Proteção XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Proteção contra MIME type sniffing
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Política de referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy básico
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://clerk.com; frame-src https://js.stripe.com;"
  );

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
