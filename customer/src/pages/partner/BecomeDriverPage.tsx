import React, { useState } from 'react'
import { Truck, CheckCircle, Clock, Calendar, Gift, Smartphone, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

export const BecomeDriverPage: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    vehicleType: 'Motorcycle',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName || !formData.phone || !formData.email || !formData.city) {
      toast.error('Please fill in all registration fields.')
      return
    }
    setFormSubmitted(true)
    toast.success('Rider application received successfully!')
  }

  const perks = [
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: 'Flexible Working Hours',
      desc: 'You are your own boss. Log in whenever you want, take breaks when needed, and choose your own delivery zones.',
    },
    {
      icon: <Calendar className="w-8 h-8 text-primary" />,
      title: 'Weekly Payouts',
      desc: 'No waiting till the end of the month. Get your earnings directly deposited into your bank account every Tuesday.',
    },
    {
      icon: <Gift className="w-8 h-8 text-primary" />,
      title: 'Exciting Incentives',
      desc: 'Earn extra bonuses for completing peak hour milestones, bad weather deliveries, weekend shifts, and referral goals.',
    },
  ]

  const riderRequirements = [
    'Must be at least 18 years of age.',
    'A valid Android smartphone (v7.0 or above) with an active data connection.',
    'Valid government identity proofs: Aadhaar Card & PAN Card.',
    'A bank account in your name for weekly earnings transfer.',
  ]

  const vehicleRequirements = [
    'For Bikes/Scooters: Valid Driver’s License and Registration Certificate (RC).',
    'For motorized vehicles: Active third-party vehicle insurance.',
    'For Bicycles: A well-maintained bicycle (license/RC not required).',
    'A safety helmet (mandatory for all motorized vehicle riders).',
  ]

  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-20 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-accent" />
            <span>Earn on the Go</span>
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ride with éets & <br className="hidden md:inline" />
            Start <span className="bg-gradient-to-r from-accent to-teal-400 bg-clip-text text-transparent">Earning Weekly</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Deliver meals from local kitchens to hungry customers, enjoy flexible shifts, weekly payments, and exciting rider insurance perks.
          </p>
          <div className="pt-4">
            <a
              href="#apply-section"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span>Join as Delivery Partner</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        
        {/* Core Perks */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {perks.map((perk, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-4"
            >
              <span className="p-3 bg-teal-50 rounded-2xl shadow-sm">{perk.icon}</span>
              <h3 className="font-heading text-lg font-bold text-textMain">{perk.title}</h3>
              <p className="text-sm text-mutedColor leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </section>

        {/* Requirements Lists */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Smartphone className="w-6 h-6" />
              </span>
              <h3 className="font-heading text-lg font-bold text-textMain">Rider Requirements</h3>
            </div>
            <ul className="space-y-3 pl-2">
              {riderRequirements.map((req, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-primary rounded-xl">
                <Truck className="w-6 h-6" />
              </span>
              <h3 className="font-heading text-lg font-bold text-textMain">Vehicle Requirements</h3>
            </div>
            <ul className="space-y-3 pl-2">
              {vehicleRequirements.map((req, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Onboarding Form */}
        <section id="apply-section" className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 md:p-10 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-2xl font-bold text-textMain">Delivery Partner Application</h2>
            <p className="text-sm text-mutedColor">
              Fill in your details below to schedule your documents verification appointment.
            </p>
          </div>

          {formSubmitted ? (
            <div className="bg-teal-50 border border-teal-200/50 rounded-2xl p-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary">Application Submitted!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for applying to éets. Our rider onboarding team will review your application and send an appointment link to your email **{formData.email}** within 24 hours.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                type="button"
                className="text-sm text-primary font-bold hover:underline"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-textMain">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Abinash Behera"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-textMain">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 9348429453"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-textMain">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. abinash@driver.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-semibold text-textMain">
                    City of Operation
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Bhubaneswar"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="vehicleType" className="block text-sm font-semibold text-textMain">
                    Delivery Vehicle Type
                  </label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain font-semibold cursor-pointer"
                  >
                    <option value="Motorcycle">Motorcycle / Scooter</option>
                    <option value="Electric Vehicle">Electric Scooter / EV</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300"
              >
                Join as Delivery Partner
              </button>
            </form>
          )}
        </section>

      </main>
    </div>
  )
}

export default BecomeDriverPage
