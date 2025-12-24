import Navbar from "@/components/Navbar";
import { auth } from "@clerk/nextjs/server";
import { CrownIcon } from "lucide-react";
import { redirect } from "next/navigation";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "Always free",
    badge: "Active",
    features: [
      "Unlimited appointment booking",
      "Basic text chat support",
      "Appointment reminders",
    ],
  },
  {
    name: "AI Basic",
    price: "$9",
    cadence: "Only billed monthly",
    subtitle: "AI consultations + appointment booking",
    features: [
      "Everything in Free",
      "10 AI voice calls per month",
      "AI dental guidance",
      "Priority support",
    ],
  },
  {
    name: "AI Pro",
    price: "$19",
    cadence: "Only billed monthly",
    subtitle: "Unlimited AI consultations",
    features: [
      "Everything in Basic",
      "Unlimited AI voice calls",
      "Personalized care plans",
      "Detailed health reports",
    ],
  },
];

export default async function ProPage() {
  try {
    const { userId } = await auth();

    if (!userId) {
      redirect("/");
    }
  } catch (error) {
    console.error("Clerk API error:", error);
    // If Clerk API fails, redirect to home
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0d0907] text-[#f4e8dc]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 pt-24">
        <div className="mb-12 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-gradient-to-r from-[#2b1811] via-[#1e120e] to-[#140c0a] rounded-3xl p-10 border border-[#3b241b] shadow-[0_20px_60px_-25px_rgba(0,0,0,0.8)]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary shadow-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Upgrade to Pro</span>
              </div>

              <div>
                <h1 className="text-4xl font-bold mb-3 text-[#f7eee3]">
                  Unlock Premium AI Dental Care
                </h1>
                <p className="text-[#d5c6b6]">
                  Get unlimited AI consultations, advanced features, and
                  priority support to take your dental health to the next level.
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/70 via-primary/60 to-primary/40 rounded-full flex items-center justify-center shadow-[0_10px_40px_-18px_rgba(37,99,235,0.8)]">
                <CrownIcon
                  className="w-16 h-16 text-primary"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>
        {/* 
        <div className="space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-[#f7eee3] tracking-wide">Choose Your Plan</h2>
            <p className="text-[#cbbdad] max-w-2xl mx-auto leading-relaxed">
              Select the perfect plan for your dental care needs. All plans include secure access
              and bank-level encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isActive = plan.badge?.toLowerCase() === "active";

              return (
                <div
                  key={plan.name}
                  className="flex flex-col border border-[#e2d7c8] rounded-2xl bg-[#f9f5ef] text-[#2b201b] shadow-[0_15px_50px_-28px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#8a7b70]">
                          {plan.subtitle || "Essential dental appointment booking"}
                        </p>
                        <h3 className="text-xl font-semibold text-[#2b201b]">{plan.name}</h3>
                      </div>
                      {plan.badge ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#fbe9dc] text-[#d57236] border border-[#f1c9a6]">
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold text-[#2b201b]">{plan.price}</span>
                        <span className="text-xs text-[#8a7b70] mb-1">
                          {plan.price === "$0" ? "" : "/month"}
                        </span>
                      </div>
                      <p className="text-xs text-[#8a7b70] mt-1">{plan.cadence}</p>
                    </div>

                    <div className="border-t border-[#e9dfd4] pt-4 space-y-2 text-sm text-[#3a2f28]">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <span className="text-[#d57236]">✓</span>
                          <span className="text-[#5c514a]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto p-4 bg-[#f1e7db] border-t border-[#e2d7c8]">
                    <button
                      disabled={isActive}
                      className={`w-full rounded-md py-2 font-semibold transition ${
                        isActive
                          ? "bg-[#ded8d0] text-[#8a7b70] cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isActive ? "Current plan" : "Subscribe"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}
      </div>
    </main>
  );
}
