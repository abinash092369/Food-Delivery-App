import React from 'react'
import { FileText, CheckCircle, AlertTriangle, ShieldCheck, Scale, HelpCircle, Clock } from 'lucide-react'

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-accent" />
            <span>Customer Protection</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Last updated: June 12, 2026. Review rules concerning refunds, order cancellations, and duplicate fees.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 space-y-8">
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              At EETS, we prioritize fair transactions. This Refund & Cancellation Policy outlines when you are eligible for refunds, our cancellation rules, and how long processing takes.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1: Order Cancellation Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">1. Order Cancellation Rules</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                To minimize food wastage and compensate our kitchen/rider partners:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Within 60 Seconds:** You can cancel your order free of charge within **60 seconds** of placing it. A full refund will be processed automatically if paid online.</li>
                <li>**After 60 Seconds:** Cancellations requested after this window will incur a **100% cancellation charge** once the kitchen accepts the order or starts preparation.</li>
                <li>**Rider Assigned:** Once a rider is dispatched to pick up the order, cancellations are strictly prohibited and no refund will be issued.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Refund Eligibility */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">2. Refund Eligibility</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                You are fully eligible for a 100% refund or item-specific partial refund under these circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The restaurant refuses to accept your order or items are sold out.</li>
                <li>Your package arrived damaged, opened, or completely spilled (requires photo verification).</li>
                <li>Items ordered are missing from the delivered packet (partial refund for missing items).</li>
                <li>The food is stale, undercooked, or contains foreign particles (requires validation by support desk).</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Failed Delivery Refunds */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <FileText className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">3. Failed Delivery Refunds</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                Refund rules for delivery failures depend on the fault source:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**EETS Fault (Rider unavailable, weather delay cancellations):** 100% refund.</li>
                <li>**Customer Fault (Unanswered calls, wrong delivery coordinates, locked gates):** No refund will be given. The order will be discarded after 10 minutes of rider wait-time.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Duplicate Payments */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">4. Duplicate Payment Refunds</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base pl-2 border-l-2 border-teal-500/30 leading-relaxed">
              If your bank account was debited multiple times due to a gateway lag, the duplicate payments are flagged automatically by EETS. The excess amount will be auto-credited to your account. You can also send a ticket via the **Report an Issue** page with screenshots of your passbook or bank SMS statement.
            </p>
          </div>

          {/* Section 5: Refund Timelines */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Clock className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">5. Refund Timelines</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base pl-2 border-l-2 border-teal-500/30 space-y-3">
              <p>Once a refund is approved by our support team, the credit is dispatched instantly. Reversal to your account depends on the payment method:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-3 font-semibold text-textMain">Payment Method</th>
                      <th className="p-3 font-semibold text-textMain">Processing SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100/50">
                      <td className="p-3">UPI (Paytm, Google Pay, PhonePe)</td>
                      <td className="p-3 font-semibold text-primary">24 to 48 Hours</td>
                    </tr>
                    <tr className="border-b border-slate-100/50">
                      <td className="p-3">Wallets (Amazon Pay, Mobikwik, etc.)</td>
                      <td className="p-3 font-semibold text-primary">24 Hours</td>
                    </tr>
                    <tr className="border-b border-slate-100/50">
                      <td className="p-3">Net Banking / Cards (Credit / Debit)</td>
                      <td className="p-3 font-semibold text-primary">5 to 7 Business Days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 6: Escalation Process */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">6. Escalation Process</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base pl-2 border-l-2 border-teal-500/30 leading-relaxed">
              If your refund is approved but has not reflected within the stated SLA, or you wish to dispute a rejected refund request, please escalate the issue. Send an email directly to our Grievance Desk at **abinashbehera189@gmail.com** with the subject "REFUND ESCALATION - [ORDER ID]". We will investigate and reply with resolution details within 12 hours.
            </p>
          </div>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-mutedColor">
            Have an ordering issue right now? File a quick report on our <a href="/report-issue" className="text-primary font-bold hover:underline">Report an Issue</a> page.
          </div>

        </div>
      </main>
    </div>
  )
}

export default RefundPolicyPage
