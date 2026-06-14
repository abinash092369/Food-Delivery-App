import React from 'react'
import { Shield, Eye, MapPin, Lock, Cookie, UserCheck, Mail } from 'lucide-react'

export const PrivacyPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>Security & Trust</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Last updated: June 12, 2026. Learn how we handle, store, and protect your personal data.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 space-y-8">
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              At EETS, your privacy is our top priority. This Privacy Policy describes how EETS Food Technologies Private Limited collects, uses, and shares your personal information when you use our services.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1: Data Collection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Eye className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">1. Data We Collect</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                We collect personal information to provide and improve our food delivery service. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Profile Details:** Name, email address, phone number, and password when you register.</li>
                <li>**Order History:** Details about the restaurants, meals, dates, and order totals.</li>
                <li>**Technical Information:** Device IP address, operating system, and app usage data.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Location Usage */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <MapPin className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">2. Location Data Usage</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                To deliver food fresh and fast, EETS requires access to your location details:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We collect your precise or approximate location to display nearby restaurants and compute accurate delivery fees.</li>
                <li>When you allow background location permissions, we share it with the assigned delivery rider to coordinate smooth handoffs.</li>
                <li>You can control location sharing through your device browser settings or operating system preferences at any time.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Payment Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Lock className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">3. Payment Security & Processing</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                Your transactions are completely safe with us:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>EETS does not directly store credit/debit card numbers or net banking passwords on our servers.</li>
                <li>All payments are processed securely through leading PCI-DSS compliant payment gateways.</li>
                <li>Data transmission is encrypted using Secure Socket Layer (SSL) standards to prevent sniffing or intercept.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Session Storage */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Cookie className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">4. Cookies & Session Storage</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                We use browser localStorage, sessionStorage, and cookies to keep you signed in and preserve state:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Authentication Tokens:** Kept in state and local storage to verify your identity.</li>
                <li>**Cart Contents:** Preserved locally so you don't lose your selected items if you refresh.</li>
                <li>**Location Cache:** Remembers your selected delivery address for quick checkout.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: User Rights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <UserCheck className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">5. Your Privacy Rights</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                Depending on your location, you have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Access & Export:** Request a copy of all personal details EETS holds about you.</li>
                <li>**Correction:** Request correcting any inaccurate details in your user profile.</li>
                <li>**Deletions:** Request deletion of your account and personal history, subject to statutory tax/auditing records retention.</li>
              </ul>
            </div>
          </div>

          {/* Section 6: Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Mail className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">6. Contact Information</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or data security, reach out to our Grievance Officer:
              </p>
              <p className="font-semibold text-textMain mt-2">
                EETS Food Technologies Private Limited
              </p>
              <p>Email: <a href="mailto:abinashbehera189@gmail.com" className="text-primary font-bold hover:underline">abinashbehera189@gmail.com</a></p>
              <p>Phone: +91 9348429453</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-mutedColor">
            Learn more about our cookies inside our dedicated <a href="/cookies" className="text-primary font-bold hover:underline">Cookie Policy</a> page.
          </div>

        </div>
      </main>
    </div>
  )
}

export default PrivacyPage
