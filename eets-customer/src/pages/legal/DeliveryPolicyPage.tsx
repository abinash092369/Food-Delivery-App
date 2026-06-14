import React from 'react'
import { Truck, MapPin, Clock, UserCheck, AlertTriangle, ShieldCheck } from 'lucide-react'

export const DeliveryPolicyPage: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-accent" />
            <span>Fulfillment Guidelines</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Delivery Policy
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Last updated: June 12, 2026. Understand our delivery radius, timelines, assignment operations, and rules.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 space-y-8">
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              EETS is dedicated to providing efficient, hygienic, and swift delivery of meals from local kitchens straight to your hands. This Delivery Policy explains our operational framework, timelines, and handler policies.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1: Delivery Radius */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <MapPin className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">1. Delivery Radius & Coverage</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                To maintain the heat, crispiness, and safety of food items:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We enforce a maximum delivery radius of **10 kilometers** from the partner restaurant to your coordinates.</li>
                <li>Delivery fees are calculated based on the linear distance between your location and the restaurant.</li>
                <li>If you enter a location outside our service radius, nearby restaurants will appear closed or unavailable for checkout.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Delivery Estimates */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Clock className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">2. Delivery Time Estimates</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                EETS prides itself on real-time transparency:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Estimates include food preparation time plus travel duration.</li>
                <li>Average deliveries take between **30 to 45 minutes** depending on distance.</li>
                <li>During peak hours (lunch 12:30 PM - 2:30 PM and dinner 7:30 PM - 9:30 PM), delivery times might increase slightly due to order volume in kitchens.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Rider Assignment Process */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <UserCheck className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">3. Rider Assignment Process</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                Once you place an order, our dispatch engine immediately initiates rider routing:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We dispatch the request to nearby verified EETS delivery partners.</li>
                <li>Once assigned, you will see the rider's name, profile image, contact details, and real-time map location on your tracking screen.</li>
                <li>Riders are trained to carry orders inside insulated thermal bags to maintain food quality.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Delay Disclaimer */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">4. Delay Disclaimer</h2>
            </div>
            <p className="text-slate-600 text-sm md:text-base pl-2 border-l-2 border-teal-500/30 leading-relaxed">
              While we aim to complete every delivery within the estimated window, delays can occur due to force majeure events including heavy downpours, political protests, road accidents, gridlocks, or sudden peak kitchen delays. In such events, our app will update with a delay notice.
            </p>
          </div>

          {/* Section 5: Failed Deliveries & Refunds */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h2 className="font-heading text-xl font-bold text-textMain">5. Failed Deliveries & Refund Associations</h2>
            </div>
            <div className="text-slate-600 text-sm md:text-base space-y-3 pl-2 border-l-2 border-teal-500/30">
              <p>
                What happens when a delivery fails:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Rider/Restaurant Fault:** If an order is cancelled because a rider is unavailable or restaurant cannot complete the order, a 100% immediate refund will be issued.</li>
                <li>**Customer Fault:** If the rider arrives at your address and cannot contact you via call/SMS after 10 minutes, or you provide an incorrect address, the order will be marked as undelivered. No refund will be given as the food was prepared and rider traveled.</li>
              </ul>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-mutedColor">
            Need details on cancellations? Visit our detailed <a href="/refund-policy" className="text-primary font-bold hover:underline">Refund & Cancellation Policy</a>.
          </div>

        </div>
      </main>
    </div>
  )
}

export default DeliveryPolicyPage
