import React from 'react'
import { FileText, ShieldAlert, BadgeInfo, ShoppingBag, CreditCard, XCircle } from 'lucide-react'

export const TermsPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Legal Documentation</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Last updated: June 12, 2026. Please read these terms carefully before using the EETS platform.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 space-y-8">
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Welcome to EETS. These Terms & Conditions govern your access to and use of our website, mobile application, and related services (collectively, the "Platform") operated by EETS Food Technologies Private Limited.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1: User Account Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">1. User Account Rules</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                To utilize the core ordering features of EETS, you must create a verified account. By registering, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                <li>Promptly update your profile information in case of any modifications.</li>
                <li>Restricting account sharing. One account should only be used by the registered owner.</li>
                <li>Be at least 18 years of age or access the service under the supervision of a parent or legal guardian.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Order Placement Terms */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">2. Order Placement Terms</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                EETS provides a platform connecting customers with registered vendor restaurants.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All orders placed through the platform are subject to restaurant acceptance and item availability.</li>
                <li>The delivery times displayed are estimates and may vary due to factors like traffic, preparation delays, or bad weather.</li>
                <li>Once an order is confirmed by the restaurant, preparation begins immediately to ensure food quality and temperature.</li>
                <li>Menu items and prices are managed directly by the restaurants and may occasionally change without notice.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Payment Terms */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <CreditCard className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">3. Payment & Pricing Terms</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                We accept multiple forms of secure online payments, including credit/debit cards, UPI, net banking, and digital wallets.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All prices listed on the platform are in Indian Rupees (INR) and are inclusive of applicable taxes, unless stated otherwise.</li>
                <li>A nominal delivery charge and platform fee may be applied to each order. These charges are explicitly broken down at the checkout screen before payment.</li>
                <li>In case of transaction failures where money is debited, the amount will be automatically refunded through our payment gateways within 5-7 business days.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Cancellation Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <XCircle className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">4. Cancellation & Refund Rules</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                EETS enforces a strict cancellation policy to support our partner kitchens and delivery riders:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Customers can cancel an order free of charge within **60 seconds** of placing it.</li>
                <li>If the restaurant has already accepted or started preparing the order, cancellations will incur a 100% cancellation fee.</li>
                <li>If an order cannot be delivered due to customer unavailability, incorrect delivery address, or failure to answer rider phone calls, no refund will be issued.</li>
              </ul>
            </div>
          </div>

          {/* Section 5: Platform Usage Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <BadgeInfo className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">5. Platform Usage Rules</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                By using the EETS customer app, you agree **not** to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Conduct fraudulent transactions or create fake accounts to abuse coupon codes.</li>
                <li>Collect data or scrape content from the EETS app for commercial purposes.</li>
                <li>Upload malicious code, viruses, or utilize bots that could interfere with the normal operation of our systems.</li>
                <li>Harass or abuse our delivery partners or support staff. Violation of this will lead to immediate account suspension.</li>
              </ul>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-mutedColor">
            Should you have any questions or clarifications regarding these Terms & Conditions, please reach out via our <a href="/support" className="text-primary font-bold hover:underline">Support Portal</a>.
          </div>

        </div>
      </main>
    </div>
  )
}

export default TermsPage
