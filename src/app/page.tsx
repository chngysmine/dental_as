import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";
import Headers from "../components/landing/Headers";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import PricingSection from "../components/landing/PricingSection";
import WhatToAsk from "../components/landing/WhatToAsk";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-background">
       <Headers/>
       <Hero/>
       <HowItWorks/>
       <WhatToAsk/>
       <PricingSection/>
       <CTA/>
       <Footer/>
    </div>
  );
}

//34:38