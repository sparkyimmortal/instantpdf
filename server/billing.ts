import { Request, Response } from "express";
import { db } from "./db";
import { billingSettings, toggleStripeSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeBillingSettingsIfMissing(): Promise<void> {
  const [existing] = await db
    .select()
    .from(billingSettings)
    .where(eq(billingSettings.id, 1))
    .limit(1);
  
  if (!existing) {
    await db.insert(billingSettings).values({
      id: 1,
      stripeEnabled: false,
    });
  }
}

export async function isStripeEnabled(): Promise<boolean> {
  const [setting] = await db
    .select()
    .from(billingSettings)
    .where(eq(billingSettings.id, 1))
    .limit(1);
  
  return setting?.stripeEnabled ?? false;
}

export async function createCheckout(req: Request, res: Response) {
  try {
    const enabled = await isStripeEnabled();
    
    if (!enabled) {
      return res.status(403).json({ 
        error: "Billing is currently disabled" 
      });
    }

    return res.status(501).json({ 
      error: "Billing not yet implemented" 
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getStripeStatus(req: Request, res: Response) {
  try {
    const enabled = await isStripeEnabled();
    res.json({ stripe_enabled: enabled });
  } catch (error) {
    console.error("Get stripe status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function toggleStripe(req: Request, res: Response) {
  try {
    const parsed = toggleStripeSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Invalid value. 'enabled' must be a boolean" 
      });
    }
    
    const { enabled } = parsed.data;
    
    await db
      .insert(billingSettings)
      .values({
        id: 1,
        stripeEnabled: enabled,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: billingSettings.id,
        set: {
          stripeEnabled: enabled,
          updatedAt: new Date(),
        },
      });

    res.json({ 
      message: `Stripe billing ${enabled ? "enabled" : "disabled"}`,
      stripe_enabled: enabled 
    });
  } catch (error) {
    console.error("Toggle stripe error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
