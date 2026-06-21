import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, Twitter, Linkedin, ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react'

export const Footer: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quickLinks: false,
    partners: false,
    support: false,
    legal: false,
    contact: false,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <footer className="relative bg-gradient-to-b from-[#0f172a] to-[#090d16] text-white border-t border-slate-800 mt-auto pt-16 pb-8 overflow-hidden">
      {/* Decorative light glows */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '4s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Column 1: Brand & Social Section */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.jpg" alt="éets Logo" className="w-8 h-8 object-contain rounded-lg shadow-md" />
              <span className="text-2xl font-heading font-extrabold text-primary tracking-wider">éets</span>
            </Link>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Fresh food delivered fast from trusted local restaurants. Discover your favorite meals, track orders in real time, and enjoy a seamless food delivery experience with éets.
            </p>
            
            {/* Social Media Links */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Follow Us</h5>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/iggudu.9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:border-accent hover:text-accent hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-xl text-slate-400 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com/share/1JTrZsxWk2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:border-accent hover:text-accent hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-xl text-slate-400 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/Abinash_092369"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:border-accent hover:text-accent hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-xl text-slate-400 transition-all duration-300"
                  aria-label="X (formerly Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/abinash-behera-732388349"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 hover:border-accent hover:text-accent hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-xl text-slate-400 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="border-b border-slate-800/80 md:border-b-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('quickLinks')}
              type="button"
              className="w-full flex items-center justify-between text-left md:pointer-events-none md:cursor-default py-2 md:py-0 focus:outline-none"
            >
              <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider md:mb-4">
                Quick Links
              </h4>
              <span className="md:hidden text-slate-400">
                {openSections.quickLinks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            <ul className={`space-y-2.5 text-sm text-slate-400 mt-3 md:mt-0 transition-all duration-300 ${openSections.quickLinks ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link to="/" className="hover:text-primary transition-colors font-medium">Home</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors font-medium">Restaurants</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary transition-colors font-medium">My Orders</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary transition-colors font-medium">Cart</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-primary transition-colors font-medium">Profile</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Partners */}
          <div className="border-b border-slate-800/80 md:border-b-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('partners')}
              type="button"
              className="w-full flex items-center justify-between text-left md:pointer-events-none md:cursor-default py-2 md:py-0 focus:outline-none"
            >
              <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider md:mb-4">
                For Partners
              </h4>
              <span className="md:hidden text-slate-400">
                {openSections.partners ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            <ul className={`space-y-2.5 text-sm text-slate-400 mt-3 md:mt-0 transition-all duration-300 ${openSections.partners ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link to="/partner/vendor" className="hover:text-primary transition-colors font-medium">Become a Vendor</Link>
              </li>
              <li>
                <Link to="/partner/driver" className="hover:text-primary transition-colors font-medium">Become a Delivery Partner</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Legal */}
          <div className="border-b border-slate-800/80 md:border-b-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('support')}
              type="button"
              className="w-full flex items-center justify-between text-left md:pointer-events-none md:cursor-default py-2 md:py-0 focus:outline-none"
            >
              <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider md:mb-4">
                Support & Legal
              </h4>
              <span className="md:hidden text-slate-400">
                {openSections.support ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            <div className={`space-y-4 mt-3 md:mt-0 transition-all duration-300 ${openSections.support ? 'block' : 'hidden md:block'}`}>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <Link to="/support" className="hover:text-primary transition-colors font-medium">Customer Support</Link>
                </li>
                <li>
                  <Link to="/help-center" className="hover:text-primary transition-colors font-medium">Help Center</Link>
                </li>
                <li>
                  <Link to="/report-issue" className="hover:text-primary transition-colors font-medium">Report an Issue</Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-primary transition-colors font-medium">Refund Policy</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-primary transition-colors font-medium">Contact Us</Link>
                </li>
              </ul>
              
              <div className="border-t border-slate-850 pt-3">
                <ul className="space-y-2.5 text-sm text-slate-400">
                  <li>
                    <Link to="/terms" className="hover:text-primary transition-colors font-medium">Terms & Conditions</Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="hover:text-primary transition-colors font-medium">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to="/cookies" className="hover:text-primary transition-colors font-medium">Cookie Policy</Link>
                  </li>
                  <li>
                    <Link to="/delivery-policy" className="hover:text-primary transition-colors font-medium">Delivery Policy</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 5: Contact Section */}
          <div className="pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('contact')}
              type="button"
              className="w-full flex items-center justify-between text-left md:pointer-events-none md:cursor-default py-2 md:py-0 focus:outline-none"
            >
              <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider md:mb-4">
                Contact éets
              </h4>
              <span className="md:hidden text-slate-400">
                {openSections.contact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            <ul className={`space-y-3.5 text-sm text-slate-400 mt-3 md:mt-0 transition-all duration-300 ${openSections.contact ? 'block' : 'hidden md:block'}`}>
              <li className="flex gap-2.5 items-start">
                <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-500">Email</span>
                  <a href="mailto:abinashgudu23@gmail.com" className="hover:text-primary font-semibold break-all">
                    abinashgudu23@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex gap-2.5 items-start">
                <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-500">Phone</span>
                  <a href="tel:+919337091334" className="hover:text-primary font-semibold">
                    +91 9337091334
                  </a>
                </div>
              </li>
              <li className="flex gap-2.5 items-start">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-500">Address</span>
                  <span className="font-semibold text-slate-300">
                    CUTM, Odisha, India
                  </span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom (Copyright) */}
        <div className="pt-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 éets Food Technologies Private Limited. All Rights Reserved.</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-650 bg-slate-950/40 px-3 py-1 rounded-full border border-slate-900">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>Secure SSL Encrypted Platform</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
