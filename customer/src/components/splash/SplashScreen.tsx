import React, { useEffect, useState } from 'react'
import { Store, Home, Leaf } from 'lucide-react'

const LOADING_MESSAGES = [
  "Finding the best restaurants...",
  "Preparing fresh recommendations...",
  "Locating nearby delivery partners...",
  "Getting your food journey ready..."
];

// Perimeter flood-fill to transparentize border-connected backgrounds and shadows
const makeImageTransparent = (src: string, threshold = 195): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(src)
        return
      }
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      const width = canvas.width
      const height = canvas.height

      const visited = new Uint8Array(width * height)
      const queue: number[] = []

      // Push all boundary (perimeter) pixels to kick off the search
      for (let x = 0; x < width; x++) {
        // Top border
        const topIdx = x
        queue.push(topIdx)
        visited[topIdx] = 1

        // Bottom border
        const bottomIdx = (height - 1) * width + x
        queue.push(bottomIdx)
        visited[bottomIdx] = 1
      }
      for (let y = 1; y < height - 1; y++) {
        // Left border
        const leftIdx = y * width
        queue.push(leftIdx)
        visited[leftIdx] = 1

        // Right border
        const rightIdx = y * width + (width - 1)
        queue.push(rightIdx)
        visited[rightIdx] = 1
      }

      // Breadth-first search inward
      let head = 0
      while (head < queue.length) {
        const idx = queue[head++]
        const x = idx % width
        const y = Math.floor(idx / width)

        const offset = idx * 4
        const r = data[offset]
        const g = data[offset + 1]
        const b = data[offset + 2]

        // If pixel is near-white or light shadow, clear it and traverse
        if (r > threshold && g > threshold && b > threshold) {
          data[offset + 3] = 0 // set alpha to transparent

          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
          ]
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx
              if (!visited[nidx]) {
                visited[nidx] = 1
                queue.push(nidx)
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0)
      resolve(canvas.toDataURL())
    }
    img.onerror = () => {
      resolve(src)
    }
  })
}

// Custom Vespa-style Scooter Rider SVG component to match the reference image
const ScooterRider: React.FC = () => {
  return (
    <svg className="w-16 h-12 animate-rider-bounce-cinematic" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Scooter Box (teal/cyan) */}
      <rect x="8" y="14" width="12" height="13" rx="2" fill="#0d9488" stroke="#0f766e" strokeWidth="1" />
      <line x1="8" y1="20" x2="20" y2="20" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
      <circle cx="14" cy="17" r="1.5" fill="#14D9D3" />

      {/* Scooter Body */}
      <path d="M20 28H44C45 28 47 29 48 31L50 35H18L20 28Z" fill="#14D9D3" />
      <path d="M42 28H46L50 35H46L42 28Z" fill="#0d9488" />
      <path d="M16 27L22 27L20 34H14L16 27Z" fill="#334155" />

      {/* Wheels */}
      <circle cx="21" cy="37" r="6.5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="21" cy="37" r="3" fill="#64748b" />
      <circle cx="21" cy="37" r="1" fill="#cbd5e1" />

      <circle cx="45" cy="37" r="6.5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="45" cy="37" r="3" fill="#64748b" />
      <circle cx="45" cy="37" r="1" fill="#cbd5e1" />

      {/* Front shield & handle bars */}
      <path d="M44 28L48 16" stroke="#14D9D3" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M48 16L45 13H42" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="15" r="2.5" fill="#fef08a" className="animate-pulse" /> {/* Headlight */}

      {/* Rider Body & Clothes */}
      <path d="M26 27C26 21 28 19 32 19H34C38 19 39 21 39 27H26Z" fill="#0d9488" /> {/* Torso */}
      <path d="M33 27L38 31" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" /> {/* Legs */}
      <path d="M36 21L45 22" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" /> {/* Arm/Hand */}

      {/* Helmet & Face */}
      <circle cx="32" cy="13" r="5" fill="#0f766e" /> {/* Face */}
      <path d="M27 13C27 9.5 29.5 7 33 7C36.5 7 39 9.5 39 13H27Z" fill="#14D9D3" /> {/* Helmet */}
      <path d="M31 11H37V13H31V11Z" fill="#0f172a" opacity="0.8" /> {/* Visor */}
    </svg>
  )
}

export const SplashScreen: React.FC = () => {
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('splash') === 'true') {
        sessionStorage.removeItem('eets_splash_shown')
        return true
      }
      return !sessionStorage.getItem('eets_splash_shown')
    }
    return true
  })
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)

  // Floating food image source and load states
  const [pizzaSrc, setPizzaSrc] = useState('/pizza_slice.png')
  const [burgerSrc, setBurgerSrc] = useState('/burger.png')
  const [friesSrc, setFriesSrc] = useState('/fries.png')
  const [imagesReady, setImagesReady] = useState(false)

  // Mouse move coordinates for parallax shift
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Process generated food images using the perimeter flood-fill algorithm
    const processImages = async () => {
      // 195 threshold connects border shadows/outlines for pizza slice
      const p = await makeImageTransparent('/pizza_slice.png', 195)
      setPizzaSrc(p)
      // 195 threshold connects border shadows/outlines for burger
      const b = await makeImageTransparent('/burger.png', 195)
      setBurgerSrc(b)
      // 195 threshold is safe for fries since carton is in the center and disconnected from borders
      const f = await makeImageTransparent('/fries.png', 195)
      setFriesSrc(f)
      
      setImagesReady(true)
    }
    processImages()

    // Add parallax mouse move listener
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const x = (clientX - window.innerWidth / 2) / 30
      const y = (clientY - window.innerHeight / 2) / 30
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Prevent background scrolling while splash is active
    document.body.style.overflow = 'hidden'

    // Rotate loading messages every 800ms
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 800)

    // Initiate dissolve exit transition at 3500ms
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, 3500)

    // Complete dissolve and restore overflow at 4000ms
    const unmountTimer = setTimeout(() => {
      setIsMounted(false)
      sessionStorage.setItem('eets_splash_shown', 'true')
      document.body.style.overflow = ''
    }, 4000)

    return () => {
      clearInterval(msgInterval)
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
      document.body.style.overflow = ''
    }
  }, [isMounted])

  if (!isMounted) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-tr from-[#b2f2ed] via-[#d1f7f4] to-[#99f6e4] text-[#0f172a] select-none overflow-hidden ${isFadingOut ? 'animate-cinematic-dissolve' : ''
        }`}
    >
      {/* Background Grid & Organic Waves */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-[1] opacity-45" />
      <div className="absolute inset-0 bg-noise pointer-events-none z-[1]" />

      {/* Floating blurred shapes for fluid design (opacity lowered to reduce white lights brightness) */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#14D9D3]/8 rounded-full blur-[140px] pointer-events-none z-[1] animate-ambient-float-1" />
      <div className="absolute bottom-[-15%] left-[10%] w-[600px] h-[600px] bg-[#44E6FF]/8 rounded-full blur-[140px] pointer-events-none z-[1] animate-ambient-float-2" />
      <div className="absolute top-[10%] right-[-15%] w-[600px] h-[600px] bg-[#5AF2FF]/6 rounded-full blur-[140px] pointer-events-none z-[1] animate-ambient-float-3" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#14D9D3]/6 rounded-full blur-[120px] pointer-events-none z-[1] animate-ambient-float-4" />

      {/* SVG corner curves matching the reference design */}
      <svg className="absolute top-0 left-0 w-[300px] md:w-[450px] h-[300px] md:h-[450px] text-[#14D9D3]/15 pointer-events-none z-[1] animate-wave-pulse" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,0 Q50,15 35,55 T100,100" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <path d="M0,0 Q70,25 55,75 T100,100" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="1.5 1.5" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-[350px] md:w-[500px] h-[350px] md:h-[500px] text-[#44E6FF]/15 pointer-events-none z-[1] animate-wave-pulse" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M100,100 Q50,85 65,45 T0,0" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <path d="M100,100 Q30,75 45,25 T0,0" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="1.5 1.5" />
      </svg>

      {/* Floating Food Elements wrapped in parallax containers with fade-in opacity transitions */}
      <div
        className="absolute left-[18%] top-[6%] z-[5] pointer-events-none transition-all duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.9}px, ${mousePos.y * 0.9}px)`,
          opacity: imagesReady ? 1 : 0
        }}
      >
        <img
          src={pizzaSrc}
          alt="Floating Pizza"
          className="w-[150px] h-[150px] object-contain floating-pizza"
        />
      </div>

      <div
        className="absolute right-[22%] top-[6%] z-[5] pointer-events-none transition-all duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * -0.7}px, ${mousePos.y * -0.7}px)`,
          opacity: imagesReady ? 1 : 0
        }}
      >
        <img
          src={burgerSrc}
          alt="Floating Burger"
          className="w-[130px] h-[130px] object-contain floating-burger"
        />
      </div>

      <div
        className="absolute right-[14%] bottom-[22%] z-[5] pointer-events-none transition-all duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          opacity: imagesReady ? 1 : 0
        }}
      >
        <img
          src={friesSrc}
          alt="Floating Fries"
          className="w-[100px] h-[100px] object-contain floating-fries"
        />
      </div>

      {/* Floating leaves with parallax wrappers */}
      <div className="absolute left-[8%] top-[18%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)` }}>
        <Leaf className="text-[#10b981] opacity-65 w-6 h-6 rotate-12 animate-ambient-float-1 filter drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      </div>
      <div className="absolute left-[26%] top-[12%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)` }}>
        <Leaf className="text-[#10b981] opacity-75 w-5 h-5 rotate-[45deg] animate-ambient-float-2 filter drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      </div>
      <div className="absolute left-[24%] bottom-[28%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}>
        <Leaf className="text-[#10b981] opacity-70 w-5 h-5 -rotate-45 animate-ambient-float-3 filter drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      </div>
      <div className="absolute right-[24%] bottom-[28%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * -0.4}px, ${mousePos.y * -0.4}px)` }}>
        <Leaf className="text-[#10b981] opacity-60 w-5 h-5 rotate-[80deg] animate-ambient-float-4 filter drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      </div>
      <div className="absolute right-[9%] top-[22%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)` }}>
        <Leaf className="text-[#10b981] opacity-70 w-6 h-6 rotate-[15deg] animate-ambient-float-5 filter drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      </div>
      <div className="absolute left-[32%] top-[3%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)` }}>
        <Leaf className="text-[#10b981] opacity-60 w-6 h-6 rotate-[30deg] animate-ambient-float-3" />
      </div>
      <div className="absolute right-[33%] top-[4%] z-[4] transition-transform duration-300 ease-out" style={{ transform: `translate(${mousePos.x * -0.2}px, ${mousePos.y * -0.2}px)` }}>
        <Leaf className="text-[#10b981] opacity-60 w-5 h-5 -rotate-12 animate-ambient-float-2" />
      </div>

      {/* Lateral Showcase - Left Side: Pasta Plate */}
      <div className="hidden xl:flex absolute left-[4%] top-[50%] -translate-y-1/2 flex-col items-center z-10 animate-slide-in-left">
        <div className="animate-food-left">
          <div className="w-[330px] h-[330px] rounded-full p-2 bg-white/20 backdrop-blur-md glow-ring-teal flex items-center justify-center relative shadow-[0_20px_45px_rgba(0,0,0,0.06)]">
            <img
              src="/pasta.png"
              alt="Penne Alfredo Pasta"
              className="w-[310px] h-[310px] rounded-full object-cover shadow-[0_12px_28px_rgba(0,0,0,0.15)]"
            />
            {/* Badge Store */}
            <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#14D9D3]/30 shadow-[0_6px_15px_rgba(20,217,211,0.2)] flex items-center justify-center text-[#14D9D3] z-20">
              <Store className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Lateral Showcase - Right Side: Salad Plate */}
      <div className="hidden xl:flex absolute right-[4%] top-[50%] -translate-y-1/2 flex-col items-center z-10 animate-slide-in-right">
        <div className="animate-food-right">
          <div className="w-[330px] h-[330px] rounded-full p-2 bg-white/20 backdrop-blur-md glow-ring-teal flex items-center justify-center relative shadow-[0_20px_45px_rgba(0,0,0,0.06)]">
            <img
              src="/salad.png"
              alt="Healthy Chicken Salad Bowl"
              className="w-[310px] h-[310px] rounded-full object-cover shadow-[0_12px_28px_rgba(0,0,0,0.15)]"
            />
            {/* Badge Home */}
            <div className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#5AF2FF]/30 shadow-[0_6px_15px_rgba(20,217,211,0.2)] flex items-center justify-center text-[#5AF2FF] z-20">
              <Home className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Central Section */}
      <div className="splash-content-fade-in flex flex-col items-center justify-center relative w-full h-full max-w-lg px-6 z-10">

        {/* Concentric rings surrounding the logo */}
        <div className="relative flex items-center justify-center w-80 h-80 logo-3d-card">
          {/* Ring 1 - Pulse */}
          <div className="absolute w-[200px] h-[200px] rounded-full border-2 border-[#14D9D3]/30 bg-[#14D9D3]/5 z-[2] animate-ring-pulse" />

          {/* Ring 2 - Rotating dashed */}
          <div className="absolute w-[260px] h-[260px] rounded-full border border-dashed border-[#14D9D3]/25 z-[2] animate-[spin_12s_linear_infinite]" />

          {/* Ring 3 - Rotating reversed */}
          <div className="absolute w-[320px] h-[320px] rounded-full border-2 border-dotted border-[#5AF2FF]/20 z-[2] animate-[spin_18s_linear_infinite_reverse]" />

          {/* Ring 4 - Outer orbit */}
          <div className="absolute w-[380px] h-[380px] rounded-full border border-[#44E6FF]/15 z-[2] animate-[spin_22s_linear_infinite]" />

          {/* Ring 5 - Particle orbit */}
          <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-[#14D9D3]/10 z-[2] animate-[spin_9s_linear_infinite] pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#14D9D3] shadow-[0_0_12px_#14D9D3,0_0_24px_#5AF2FF]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full bg-[#44E6FF] shadow-[0_0_10px_#44E6FF]" />
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#fef08a] shadow-[0_0_8px_#fef08a]" />
          </div>

          {/* App Icon Card container */}
          <div className="animate-logo-entrance z-10">
            <div className="animate-logo-3d">
              <div className="relative w-[150px] h-[150px] flex items-center justify-center bg-gradient-to-br from-[#14D9D3] via-[#0d9488] to-[#0f766e] rounded-[2.2rem] p-0.5 shadow-[0_25px_50px_-12px_rgba(20,217,211,0.5),0_0_0_6px_rgba(255,255,255,0.7),0_0_20px_6px_rgba(20,217,211,0.3)] glass-shine">
                <img
                  src="/logo.jpg"
                  alt="éets Logo"
                  className="w-full h-full object-cover rounded-[2rem] relative z-10"
                />
                {/* Top Gloss Highlight reflection */}
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none z-20" />
                <div className="absolute top-1 left-2 right-2 h-[40%] rounded-t-[2rem] bg-white/10 pointer-events-none z-20" />
              </div>
            </div>
          </div>
        </div>

        {/* 3D Title "éets" */}
        <h1 className="mt-4 font-heading font-black text-[65px] md:text-[95px] tracking-wider flex items-center gap-1.5 z-10 leading-none">
          {['é', 'e', 't', 's'].map((char, index) => (
            <span
              key={index}
              className="letter-reveal"
              style={{
                animationDelay: `${1.2 + index * 0.1}s`,
              }}
            >
              <span className="text-3d-premium-glow animate-shine-sweep block">
                {char}
              </span>
            </span>
          ))}
        </h1>

        {/* Tagline */}
        <div className="flex flex-col items-center gap-3 z-10 mt-2">
          <p className="font-heading font-semibold text-lg md:text-2xl text-slate-600 tracking-[0.16em] animate-tagline-fade-up">
            Fresh Food. <span className="text-[#0d9488]">Delivered Fast.</span>
          </p>
          <div className="w-5 h-5 text-[#14D9D3] opacity-85 animate-tagline-fade-up" style={{ animationDelay: '1.8s' }}>
            <Leaf className="w-5 h-5 mx-auto animate-bounce text-emerald-600" fill="currentColor" />
          </div>
        </div>

        {/* Bottom Delivery Rider Track Loader */}
        <div className="absolute bottom-12 w-full max-w-[340px] md:max-w-[420px] px-4 flex flex-col items-center z-10">
          <div className="w-full flex items-center relative">
            {/* Store Badge */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[#14D9D3]/20 shadow-[0_5px_15px_rgba(20,217,211,0.15)] z-10">
              <Store className="w-5 h-5 text-teal-600" />
            </div>

            {/* Track line & animated rider wrapper (outside overflow-hidden) */}
            <div className="flex-grow mx-3 h-2.5 relative">
              {/* Inner track path (overflow hidden) */}
              <div className="w-full h-full bg-slate-200/80 backdrop-blur-sm rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
                {/* Glowing progress filling the track */}
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#14D9D3] via-[#44E6FF] to-[#0d9488] rounded-full animate-route-infinite shadow-[0_0_10px_#14D9D3]" />
              </div>

              {/* Scooter Rider passing along the track (placed outside overflow-hidden) */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-12 animate-rider-infinite flex items-center justify-end pointer-events-none z-[12]">
                <div className="w-16 h-[4px] bg-gradient-to-r from-transparent via-[#44E6FF]/50 to-[#14D9D3]/90 mr-[-2px] blur-[1px]" />
                <ScooterRider />
              </div>
            </div>

            {/* Home Badge */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[#44E6FF]/20 shadow-[0_5px_15px_rgba(20,217,211,0.15)] z-10">
              <Home className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Translucent Capsule for message */}
          <div className="mt-5 w-full flex flex-col items-center gap-2">
            <div className="bg-white/45 backdrop-blur-md border border-white/60 py-2 px-6 rounded-full shadow-[0_8px_25px_-5px_rgba(0,0,0,0.05),0_0_0_1px_rgba(255,255,255,0.4)]">
              <span className="text-sm font-heading font-medium tracking-[0.08em] text-[#0f766e] select-none transition-all duration-300">
                {LOADING_MESSAGES[msgIndex]}
              </span>
            </div>

            {/* Slide Indicators matching message rotation */}
            <div className="flex items-center gap-1.5 mt-1">
              {LOADING_MESSAGES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 rounded-full transition-all duration-300 ${msgIndex === idx
                    ? 'w-6 bg-[#0d9488]'
                    : 'w-2.5 bg-[#cbd5e1]'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Light sweep overlay effect (reduced opacity to prevent glare) */}
      <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-[#14D9D3]/0 via-white/15 to-transparent pointer-events-none z-[99] animate-light-sweep" />
    </div>
  )
}

export default SplashScreen
