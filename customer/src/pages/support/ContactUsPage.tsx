import React from 'react'
import { Mail, Phone, MessageSquare, MapPin, Clock, ShieldCheck, ChevronRight } from 'lucide-react'

export const ContactUsPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
            <span>Get in Touch</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Contact Us
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Have a question, feedback, or business proposal? Reach out to us through any channel below.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Methods (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-heading text-xl font-bold text-textMain pl-1">
              Communication Channels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Email Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <span className="p-3 bg-teal-50 text-primary rounded-xl inline-block">
                  <Mail className="w-6 h-6" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-textMain">Email Address</h3>
                  <p className="text-xs text-mutedColor">Write to us for general or billing enquiries.</p>
                  <a
                    href="mailto:abinashbehera189@gmail.com"
                    className="block text-sm font-bold text-primary hover:underline break-all"
                  >
                    abinashbehera189@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <span className="p-3 bg-teal-50 text-primary rounded-xl inline-block">
                  <Phone className="w-6 h-6" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-textMain">Customer Hotline</h3>
                  <p className="text-xs text-mutedColor">Call us during operational business hours.</p>
                  <a
                    href="tel:+919348429453"
                    className="block text-sm font-bold text-primary hover:underline"
                  >
                    +91 9348429453
                  </a>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <span className="p-3 bg-teal-50 text-primary rounded-xl inline-block">
                  <MessageSquare className="w-6 h-6" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-textMain">WhatsApp Chat</h3>
                  <p className="text-xs text-mutedColor">Connect for speedy live chat updates.</p>
                  <a
                    href="https://wa.me/919348429453"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-bold text-primary hover:underline"
                  >
                    Open WhatsApp Chat
                  </a>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <span className="p-3 bg-teal-50 text-primary rounded-xl inline-block">
                  <MapPin className="w-6 h-6" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-sm text-textMain">Office Address</h3>
                  <p className="text-xs text-mutedColor">Registered business office locality.</p>
                  <span className="block text-sm font-bold text-slate-700">
                    Bhubaneswar, Odisha, India
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Business details (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-heading text-xl font-bold text-textMain pl-1">
              Operating Details
            </h2>
            
            {/* Hours & Response SLA */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Business Hours */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-textMain">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-sm">Business Hours</h3>
                </div>
                <div className="pl-7 space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between font-semibold">
                    <span>Monday - Sunday</span>
                    <span className="text-primary">9:00 AM – 10:00 PM</span>
                  </div>
                  <p className="text-xs text-mutedColor">Note: Delivery operations follow kitchen timings.</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Response SLA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-textMain">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-sm">Response Service Level (SLA)</h3>
                </div>
                <div className="pl-7 space-y-3 text-xs md:text-sm text-slate-600">
                  
                  {/* Email SLA */}
                  <div className="flex justify-between items-center">
                    <span>Email Support</span>
                    <span className="px-2.5 py-1 bg-teal-50 text-primary border border-teal-200/30 rounded-full font-bold text-xs">
                      Within 24 Hours
                    </span>
                  </div>

                  {/* WhatsApp SLA */}
                  <div className="flex justify-between items-center">
                    <span>WhatsApp Chat</span>
                    <span className="px-2.5 py-1 bg-teal-50 text-primary border border-teal-200/30 rounded-full font-bold text-xs">
                      Within 2 Hours
                    </span>
                  </div>

                  {/* Phone SLA */}
                  <div className="flex justify-between items-center">
                    <span>Phone Support</span>
                    <span className="px-2.5 py-1 bg-teal-50 text-primary border border-teal-200/30 rounded-full font-bold text-xs">
                      During Business Hours
                    </span>
                  </div>

                </div>
              </div>

            </div>

            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 text-center text-xs text-mutedColor">
              Prefer filing a digital ticket? Head to our <a href="/report-issue" className="text-primary font-bold hover:underline">Report an Issue</a> system.
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}

export default ContactUsPage
