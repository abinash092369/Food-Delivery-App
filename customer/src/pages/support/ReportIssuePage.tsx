import React, { useState } from 'react'
import { AlertTriangle, Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export const ReportIssuePage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    orderId: '',
    category: 'Ordering Issues',
    description: '',
  })
  
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.description) {
      toast.error('Please fill in the Name, Email, and Description fields.')
      return
    }

    const emailTo = 'abinashbehera189@gmail.com'
    const subject = `éets Issue Report - [${formData.category}]`
    const body = `éets CUSTOMER APP ISSUE REPORT\n===============================\n\nFull Name: ${formData.fullName}\nEmail Address: ${formData.email}\nOrder ID: ${formData.orderId || 'None Specified'}\nIssue Category: ${formData.category}\n\nDescription:\n${formData.description}\n\n===============================\nSubmitted via éets Customer Portal.`

    const mailtoUrl = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    // Open email client draft
    window.location.href = mailtoUrl
    
    setIsSuccess(true)
    toast.success('Opening email client draft...')
  }

  const categories = [
    'Ordering Issues',
    'Payment Issues',
    'Delivery Delays',
    'Refund Requests',
    'Account Problems',
    'Food Quality Concerns',
    'Other Technical Bugs',
  ]

  return (
    <div className="pb-16 min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-navy via-[#0c4a6e] to-[#042f2e] py-16 px-4 text-center border-b border-slate-900 shadow-md">
        <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-accent border border-teal-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
            <span>Problem Resolution</span>
          </span>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Report an Issue
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Encountered a problem during payment, cart checkout, or delivery? File a report here.
          </p>
        </div>
      </section>

      {/* Main Form container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <span className="w-16 h-16 bg-teal-50 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </span>
              <h3 className="font-heading text-xl font-bold text-primary">Email Draft Opened!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                We have generated a pre-filled issue ticket email. If your email application didn't open automatically, please send details to **abinashbehera189@gmail.com**.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                type="button"
                className="text-sm text-primary font-bold hover:underline"
              >
                File another report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-sm font-semibold text-textMain">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Abinash Behera"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-textMain">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="orderId" className="block text-sm font-semibold text-textMain">
                  Order ID <span className="text-xs text-mutedColor font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  placeholder="e.g. #10245"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-semibold text-textMain">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain font-semibold cursor-pointer"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="block text-sm font-semibold text-textMain">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please describe the issue in detail. E.g., transaction debited but order failed, or items missing..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl outline-none text-sm transition-all text-textMain resize-y"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                <span>Submit & Open Email Draft</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default ReportIssuePage
