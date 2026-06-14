import React from 'react'
import { Cookie, CheckCircle2, ShieldAlert, Sliders, Info } from 'lucide-react'

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Cookie className="w-3.5 h-3.5 text-accent" />
            <span>Browser Preferences</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Last updated: June 12, 2026. Understand how we use cookies and browser storage to optimize EETS.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 space-y-8">
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              To make your food ordering experience as smooth as possible, the EETS customer platform uses cookies, local browser storage, and other tracking technologies. This Cookie Policy explains what these technologies are and how you can manage them.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1: What are cookies */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Info className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">1. What are Cookies?</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base pl-2 border-l-2 border-teal-500/30 leading-relaxed">
              Cookies are small text files stored on your device when you visit websites. LocalStorage and SessionStorage are modern browser databases that perform a similar function, saving configuration or token data locally without expiring unless explicitly requested.
            </p>
          </div>

          {/* Section 2: Essential Cookies */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">2. Essential & Core Cookies</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                These cookies are absolutely necessary for the EETS customer application to function and cannot be turned off:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Authentication Tokens:** Keep you signed into your profile securely.</li>
                <li>**Cart Preservation:** Retain the list of selected meals, snacks, and drinks in your basket during checkouts.</li>
                <li>**Location Preferences:** Remember your chosen delivery coordinates so you get correct restaurant availability immediately.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Analytics & Performance */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">3. Analytics & Performance Cookies</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                These allow us to track usage and optimize performance:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We measure which restaurants receive the most profile clicks and which menu sections have the highest scroll rates.</li>
                <li>We identify app load performance times and page errors to constantly patch bugs.</li>
                <li>All data gathered via performance analytics is aggregated and anonymized.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Preference cookies */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Sliders className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">4. Preferences & Customization</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                These cookies enable a customized user experience:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Remembering your recent search queries (e.g. "Biryani", "Pizza") to recommend dishes.</li>
                <li>Remembering coupon codes or discount notifications you closed so they don't pop up again.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Cookie management */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Sliders className="w-6 h-6 text-primary" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">5. How to Manage Cookies</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base pl-2 border-l-2 border-teal-500/30 leading-relaxed">
              You can block or delete cookies through your web browser preferences (such as Chrome, Safari, Edge, or Firefox settings). However, please note that blocking essential cookies will make it impossible to sign in, use the cart drawer, or place orders on EETS.
            </p>
          </div>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-mutedColor">
            Read our complete <a href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</a> to see how we safeguard all user accounts data.
          </div>

        </div>
      </main>
    </div>
  )
}

export default CookiePolicyPage
