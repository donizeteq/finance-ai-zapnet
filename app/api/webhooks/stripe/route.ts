import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Rate limiting simples em memória (em produção, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests por minuto

export const POST = async (request: Request) => {
  try {
    // Verificação de variáveis de ambiente
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe environment variables not configured");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    // Rate limiting básico
    const clientIP = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    
    const now = Date.now();
    const clientData = rateLimitMap.get(clientIP);
    
    if (clientData) {
      if (now - clientData.lastReset > RATE_LIMIT_WINDOW) {
        clientData.count = 1;
        clientData.lastReset = now;
      } else {
        clientData.count++;
        if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
          return new NextResponse("Too many requests", { status: 429 });
        }
      }
    } else {
      rateLimitMap.set(clientIP, { count: 1, lastReset: now });
    }

    // Verificação de assinatura
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing Stripe signature");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verificação de content-type
    const contentType = request.headers.get("content-type");
    if (contentType !== "application/json") {
      return new NextResponse("Invalid content type", { status: 400 });
    }

    const text = await request.text();
    
    // Validação básica do payload
    if (!text || text.length === 0) {
      return new NextResponse("Empty payload", { status: 400 });
    }

    // Limite de tamanho do payload (1MB)
    if (text.length > 1024 * 1024) {
      return new NextResponse("Payload too large", { status: 413 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-10-28.acacia",
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        text,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new NextResponse("Invalid signature", { status: 400 });
    }
    // Processar eventos do Stripe
    switch (event.type) {
      case "invoice.paid": {
        try {
          const { customer, subscription, subscription_details } = event.data.object;
          
          // Validação dos dados recebidos
          if (!customer || !subscription || !subscription_details) {
            console.error("Missing required data in invoice.paid event");
            return new NextResponse("Invalid event data", { status: 400 });
          }

          const clerkUserId = subscription_details?.metadata?.clerk_user_id;
          if (!clerkUserId) {
            console.error("Missing clerk_user_id in subscription metadata");
            return new NextResponse("Invalid user data", { status: 400 });
          }

          // Validação do formato do userId do Clerk
          if (typeof clerkUserId !== 'string' || clerkUserId.length < 10) {
            console.error("Invalid clerk user ID format");
            return new NextResponse("Invalid user ID", { status: 400 });
          }

          await clerkClient().users.updateUser(clerkUserId, {
            privateMetadata: {
              stripeCustomerId: customer,
              stripeSubscriptionId: subscription,
            },
            publicMetadata: {
              subscriptionPlan: "premium",
            },
          });

          console.log(`Successfully updated user ${clerkUserId} to premium plan`);
        } catch (error) {
          console.error("Error processing invoice.paid event:", error);
          return new NextResponse("Internal server error", { status: 500 });
        }
        break;
      }

      case "customer.subscription.deleted": {
        try {
          const subscriptionId = event.data.object.id;
          
          if (!subscriptionId) {
            console.error("Missing subscription ID in customer.subscription.deleted event");
            return new NextResponse("Invalid event data", { status: 400 });
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const clerkUserId = subscription.metadata?.clerk_user_id;
          
          if (!clerkUserId) {
            console.error("Missing clerk_user_id in subscription metadata");
            return new NextResponse("Invalid user data", { status: 400 });
          }

          // Validação do formato do userId do Clerk
          if (typeof clerkUserId !== 'string' || clerkUserId.length < 10) {
            console.error("Invalid clerk user ID format");
            return new NextResponse("Invalid user ID", { status: 400 });
          }

          await clerkClient().users.updateUser(clerkUserId, {
            privateMetadata: {
              stripeCustomerId: null,
              stripeSubscriptionId: null,
            },
            publicMetadata: {
              subscriptionPlan: null,
            },
          });

          console.log(`Successfully removed premium plan from user ${clerkUserId}`);
        } catch (error) {
          console.error("Error processing customer.subscription.deleted event:", error);
          return new NextResponse("Internal server error", { status: 500 });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error("Unexpected error in webhook handler:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
};
