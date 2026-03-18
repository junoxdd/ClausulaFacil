import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is missing. Using mock Stripe client.");
      stripeClient = new Stripe("sk_test_mock");
    } else {
      stripeClient = new Stripe(key);
    }
  }
  return stripeClient;
}

let firebaseAdminApp: admin.app.App | null = null;
function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseAdminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT is missing. Webhooks won't be able to update Firestore.");
        // We don't initialize to avoid crashing, but we'll handle the null case in the webhook
      }
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  }
  return firebaseAdminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook needs raw body
  app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET is missing. Cannot verify webhook signature.");
      return res.status(400).send(`Webhook Error: Missing secret`);
    }

    let event;
    const stripe = getStripe();

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      const adminApp = getFirebaseAdmin();
      if (!adminApp) {
        throw new Error("Firebase Admin not initialized. Cannot update user profile.");
      }
      
      const db = adminApp.firestore();

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id;
          
          if (userId) {
            // Determine plan from session or line items
            // For simplicity, we assume we passed the plan in metadata
            const plan = session.metadata?.plan || 'pro';
            
            await db.collection('users').doc(userId).set({
              plan: plan,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log(`Updated user ${userId} to plan ${plan}`);
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID and downgrade to free
          const usersRef = db.collection('users');
          const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              plan: 'free',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Downgraded user ${userDoc.id} to free plan`);
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({received: true});
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planId, successUrl, cancelUrl, userId } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        // Mock response for preview environment without Stripe key
        return res.json({ 
          url: `${successUrl}?session_id=mock_session_123&plan=${planId}` 
        });
      }

      const stripe = getStripe();

      // Map your plan IDs to Stripe Price IDs
      const priceMap: Record<string, string> = {
        'pro': process.env.STRIPE_PRICE_PRO || 'price_mock_pro',
        'unlimited': process.env.STRIPE_PRICE_UNLIMITED || 'price_mock_unlimited'
      };

      const priceId = priceMap[planId];

      if (!priceId) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          plan: planId
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
