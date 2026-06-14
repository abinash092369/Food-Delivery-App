import React, { useState } from 'react'
import { HelpCircle, Phone, MessageSquare, Search, ChevronDown, ChevronUp, ShoppingBag, CreditCard, Clock, RotateCcw, User, Info } from 'lucide-react'

interface FAQItem {
  q: string
  a: string
}

export const HelpCenterPage: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<'ordering' | 'payment' | 'delivery' | 'refund' | 'account' | 'faqs'>('faqs')
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const supportPhone = '+91 9348429453'
  const smsAction = 'sms:+919348429453'
  const whatsappAction = 'https://wa.me/919348429453'

  const topics = [
    { id: 'faqs', name: 'General FAQs', icon: <Info className="w-5 h-5" /> },
    { id: 'ordering', name: 'Ordering Issues', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'payment', name: 'Payment Issues', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'delivery', name: 'Delivery Delays', icon: <Clock className="w-5 h-5" /> },
    { id: 'refund', name: 'Refund Requests', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'account', name: 'Account Problems', icon: <User className="w-5 h-5" /> },
  ] as const

  const faqData: Record<typeof activeTopic, FAQItem[]> = {
    faqs: [
      { q: 'How does EETS deliver food so fast?', a: 'We partner with restaurants that prioritize preparation times, and utilize an automated routing algorithm to assign the nearest delivery partner to your order.' },
      { q: 'Is there a minimum order value?', a: 'No, EETS does not enforce a minimum order value. However, orders below ₹100 may incur a small cart value fee.' },
      { q: 'Can I track my delivery rider in real time?', a: 'Yes! Once a rider is assigned to your order, you can view their live coordinates and route progress directly on the Order Tracking page.' }
    ],
    ordering: [
      { q: 'My order was accepted but I need to modify it. How can I do this?', a: 'Because restaurants start cooking food immediately, orders cannot be modified once accepted. You can contact support within 60 seconds of placement to request cancellation.' },
      { q: 'Items are missing from my delivered order. What should I do?', a: 'Please go to the "Report an Issue" page or contact support immediately with your Order ID and photos of the package. We will process a refund for the missing items.' },
      { q: 'Can I schedule an order for later?', a: 'Currently, EETS operates on an on-demand immediate delivery basis. Scheduled deliveries will be introduced in future updates.' }
    ],
    payment: [
      { q: 'My transaction failed but the amount was debited. What should I do?', a: 'Do not worry. Failed transactions are automatically flagged by our partner payment gateways. Debited amounts are refunded to the original payment source within 5-7 business days.' },
      { q: 'What payment methods do you support?', a: 'We support all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and select digital wallets.' },
      { q: 'Can I pay via Cash on Delivery (COD)?', a: 'To maintain rider safety and zero-contact hygiene protocols, EETS operates strictly on pre-paid online transactions.' }
    ],
    delivery: [
      { q: 'My order is delayed. How do I get updates?', a: 'You can check the live tracking screen for status updates. If the delay exceeds 15 minutes past the estimated window, click the support chat link or call the rider directly.' },
      { q: 'The rider is standing far from my building. What should I do?', a: 'Delivery partners are instructed to deliver to your doorstep. If they are facing navigation or building security issues, you can call them using the contact number on the tracker screen.' },
      { q: 'How is the delivery fee calculated?', a: 'Delivery fees are calculated dynamically based on the distance between the restaurant and your location, as well as weather and peak hourly demand.' }
    ],
    refund: [
      { q: 'What is the refund timeline for cancelled orders?', a: 'UPI and Wallet refunds usually reflect within 24-48 hours. Credit/Debit card refunds may take 5-7 business days depending on your bank.' },
      { q: 'Am I eligible for a refund if I cancel my order late?', a: 'If you cancel after 60 seconds of order placement and the restaurant has started preparation, you will not be eligible for a refund due to kitchen ingredient costs.' },
      { q: 'How do I claim a refund for food quality issues?', a: 'Raise a ticket on the "Report an Issue" page within 2 hours of delivery. Include description and photos of the food quality concern.' }
    ],
    account: [
      { q: 'How do I change my registered phone number?', a: 'Go to your Profile tab, click edit profile, enter the new mobile number, and complete the OTP verification process.' },
      { q: 'Can I delete my EETS account permanently?', a: 'Yes. Navigate to Profile > Settings > Delete Account. Please note this will permanently erase your order history and saved addresses.' },
      { q: 'Why am I not receiving notification alerts?', a: 'Please ensure that EETS browser/app notifications are allowed in your device settings. Also check the Notifications tab in the navbar.' }
    ]
  }

  // Filter FAQs based on search
  const allFaqs = activeTopic ? faqData[activeTopic] : []
  const filteredFaqs = allFaqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span>Faq & Help Center</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            How can we help you today?
          </h1>
          
          {/* FAQ search bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search help topics or questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-none focus:ring-2 focus:ring-primary rounded-xl outline-none text-sm text-textMain shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-heading font-bold text-textMain text-sm uppercase tracking-wider pl-1">
              Select Help Category
            </h3>
            <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-1">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setActiveTopic(topic.id)
                    setOpenFaqIndex(null)
                  }}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTopic === topic.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-mutedColor hover:bg-slate-50 hover:text-textMain'
                  }`}
                >
                  {topic.icon}
                  <span>{topic.name}</span>
                </button>
              ))}
            </div>

            {/* Quick Contact Box */}
            <div className="bg-gradient-to-br from-navy to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
              <h4 className="font-heading font-bold text-sm">Still need assistance?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with our 24/7 client relations cell through SMS or WhatsApp.
              </p>
              <div className="space-y-2">
                <a
                  href={smsAction}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white"
                >
                  <Phone className="w-4 h-4 text-accent" />
                  <span>Send SMS to Support</span>
                </a>
                <a
                  href={whatsappAction}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
              <div className="text-[10px] text-center text-slate-500">
                Hotline: {supportPhone}
              </div>
            </div>
          </div>

          {/* Accordion Questions Area */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-textMain pl-1 flex items-center gap-2">
              <span>{topics.find((t) => t.id === activeTopic)?.name}</span>
              {searchQuery && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-mutedColor rounded-full">
                  Search active
                </span>
              )}
            </h2>

            {filteredFaqs.length > 0 ? (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index
                  return (
                    <div
                      key={index}
                      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        type="button"
                        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <span className="font-heading font-bold text-sm md:text-base text-textMain">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-mutedColor shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-50 animate-fade-in pl-6">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-2xl block mb-2">🔍</span>
                <h3 className="font-heading text-lg font-bold text-textMain">No FAQs found</h3>
                <p className="text-xs text-mutedColor max-w-xs mx-auto">
                  Try searching for general keywords like "refund", "card", or "order".
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default HelpCenterPage
