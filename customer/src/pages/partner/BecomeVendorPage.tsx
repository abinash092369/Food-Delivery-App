import React, { useState } from 'react'
import { Store, CheckCircle, TrendingUp, Cpu, Award, Users, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

export const BecomeVendorPage: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    cuisine: 'North Indian',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.restaurantName || !formData.ownerName || !formData.phone || !formData.email || !formData.city) {
      toast.error('Please fill in all registration fields.')
      return
    }
    setFormSubmitted(true)
    toast.success('Onboarding registration request received!')
  }

  const onboardingSteps = [
    {
      step: '1',
      title: 'Register Online',
      desc: 'Fill out the onboarding application, upload your FSSAI license, GST certificates, and restaurant menu.',
    },
    {
      step: '2',
      title: 'Setup Menu & Prices',
      desc: 'Our onboarding team will review documents and configure your digital catalog with images and prices.',
    },
    {
      step: '3',
      title: 'Go Live & Accept Orders',
      desc: 'Login to the éets Vendor App, set your kitchen status to Active, and start receiving orders from riders.',
    },
  ]

  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: 'Increase Your Sales',
      desc: 'Reach thousands of active customers daily in your city and increase your kitchen utility and sales volume.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-primary" />,
      title: 'Real-Time Dashboard',
      desc: 'Manage orders, track dispatch status, adjust prep time, and update item availability dynamically.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: 'Marketing & Growth Tools',
      desc: 'Launch custom discount coupons, run targeted promotional banners, and evaluate detailed performance reports.',
    },
    {
      icon: <Award className="w-6 h-6 text-primary" />,
      title: 'Delivery Rider Network',
      desc: 'Rely on éets’ professional delivery fleet. No need to hire your own drivers—we handle all coordination.',
    },
  ]

  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-20 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-accent" />
            <span>Partner With éets</span>
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Grow Your Kitchen Business <br className="hidden md:inline" />
            With <span className="bg-gradient-to-r from-accent to-teal-400 bg-clip-text text-transparent">éets Restaurant Partner</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Onboard your restaurant, manage orders in real-time, leverage robust promotional tools, and enjoy secure weekly payouts.
          </p>
          <div className="pt-4">
            <a
              href="#register-section"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span>Register Your Restaurant</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-16">
        
        {/* Step-by-Step Onboarding */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-textMain">
              Simple 3-Step Onboarding Process
            </h2>
            <p className="text-sm text-mutedColor">
              Start receiving orders from hungry locals in less than 48 hours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {onboardingSteps.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-4"
              >
                <span className="w-12 h-12 rounded-2xl bg-teal-50 text-primary flex items-center justify-center font-heading text-xl font-extrabold shadow-sm">
                  {item.step}
                </span>
                <h3 className="font-heading text-lg font-bold text-textMain">{item.title}</h3>
                <p className="text-sm text-mutedColor leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits & Growth Tools */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-textMain">
              Why Partner with éets?
            </h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              We provide the digital tools, rider network, and transaction platform so you can focus entirely on cooking delicious food.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {benefits.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-teal-50 rounded-lg">{item.icon}</span>
                    <h4 className="font-heading text-sm font-bold text-textMain">{item.title}</h4>
                  </div>
                  <p className="text-xs text-mutedColor pl-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-navy to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <h3 className="font-heading text-lg font-bold">Transparent Commission Structure</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              No surprises or hidden fees. We believe in building a mutually profitable partnership.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <span className="block text-2xl md:text-3xl font-heading font-extrabold text-accent">15%</span>
                <span className="block text-xs text-slate-400 mt-1">Flat Commission</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <span className="block text-2xl md:text-3xl font-heading font-extrabold text-teal-400">₹0</span>
                <span className="block text-xs text-slate-400 mt-1">Onboarding Fee</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <span className="block text-2xl md:text-3xl font-heading font-extrabold text-teal-400">Weekly</span>
                <span className="block text-xs text-slate-400 mt-1">Payout Settlement</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <span className="block text-2xl md:text-3xl font-heading font-extrabold text-accent">Free</span>
                <span className="block text-xs text-slate-400 mt-1">Merchant Terminal App</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 text-xs text-slate-400">
              * Commission is charged only on net food order value (excluding delivery fee and GST).
            </div>
          </div>
        </section>

        {/* Lead Capture Registration Form */}
        <section id="register-section" className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 md:p-10 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-2xl font-bold text-textMain">Register Your Restaurant</h2>
            <p className="text-sm text-mutedColor">
              Fill in your basic kitchen details. Our onboarding expert will call you back within 24 hours.
            </p>
          </div>

          {formSubmitted ? (
            <div className="bg-teal-50 border border-teal-200/50 rounded-2xl p-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary">Registration Request Received!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for applying to éets. Our representative will contact you on **{formData.phone}** or email you at **{formData.email}** shortly to verify documents.
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
                  <label htmlFor="restaurantName" className="block text-sm font-semibold text-textMain">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    placeholder="e.g. Punjabi Tadka Restaurant"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ownerName" className="block text-sm font-semibold text-textMain">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
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
                    placeholder="e.g. partner@restaurant.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-semibold text-textMain">
                    Operating City
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
                <div className="space-y-2">
                  <label htmlFor="cuisine" className="block text-sm font-semibold text-textMain">
                    Primary Cuisine Type
                  </label>
                  <select
                    id="cuisine"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain font-semibold cursor-pointer"
                  >
                    <option value="North Indian">North Indian</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Pizza & Italian">Pizza & Italian</option>
                    <option value="Burgers & Fast Food">Burgers & Fast Food</option>
                    <option value="Desserts & Bakery">Desserts & Bakery</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300"
              >
                Register Your Restaurant
              </button>
            </form>
          )}
        </section>

      </main>
    </div>
  )
}

export default BecomeVendorPage
