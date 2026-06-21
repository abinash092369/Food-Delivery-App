import React from 'react'
import { LifeBuoy, Mail, HelpCircle, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const CustomerSupportPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <LifeBuoy className="w-3.5 h-3.5 text-accent" />
            <span>24/7 Assistance</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Customer Support
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Have a question about your order, refunds, or restaurant details? Contact our team.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8">
        
        {/* Email Support Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 text-center space-y-6">
          <span className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto text-primary shadow-sm">
            <Mail className="w-8 h-8" />
          </span>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold text-textMain">Email Support</h2>
            <p className="text-sm text-mutedColor max-w-md mx-auto">
              Our professional support agents respond to email queries and dispute tickets within 24 hours.
            </p>
            <p className="font-heading font-semibold text-lg text-primary select-all">
              abinashbehera189@gmail.com
            </p>
          </div>
          <div>
            <a
              href="mailto:abinashbehera189@gmail.com?subject=éets Customer Support"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span>Email Support</span>
            </a>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/help-center"
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-200/50 transition-all duration-300 space-y-4 group"
          >
            <span className="p-2.5 bg-teal-50 text-primary rounded-xl inline-block group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </span>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-textMain flex items-center gap-1">
                <span>Help Center</span>
                <ChevronRight className="w-4 h-4 text-mutedColor group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-mutedColor">FAQs, instant SMS & WhatsApp support.</p>
            </div>
          </Link>

          <Link
            to="/report-issue"
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-200/50 transition-all duration-300 space-y-4 group"
          >
            <span className="p-2.5 bg-teal-50 text-primary rounded-xl inline-block group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </span>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-textMain flex items-center gap-1">
                <span>Report an Issue</span>
                <ChevronRight className="w-4 h-4 text-mutedColor group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-mutedColor">Raise order tickets, items issues, or platform bugs.</p>
            </div>
          </Link>

          <Link
            to="/refund-policy"
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-200/50 transition-all duration-300 space-y-4 group"
          >
            <span className="p-2.5 bg-teal-50 text-primary rounded-xl inline-block group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </span>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-textMain flex items-center gap-1">
                <span>Refund & Cancellations</span>
                <ChevronRight className="w-4 h-4 text-mutedColor group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-mutedColor">Understand cancellation fees and refund timelines.</p>
            </div>
          </Link>
        </div>

        {/* Tip Alert */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 flex gap-4 items-start">
          <HelpCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-slate-600">
            <h4 className="font-bold text-textMain">Tip: Keep Your Order ID Ready</h4>
            <p>
              When reaching out to our support staff via email, always mention your **Order ID** (e.g. `#10245`) so we can fetch your details and resolve issues without delay.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

export default CustomerSupportPage
