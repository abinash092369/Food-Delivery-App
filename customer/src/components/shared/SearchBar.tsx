import React, { useState, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useSearch } from '../../hooks/useSearch'

interface SearchBarProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const PLACEHOLDERS = [
  'Search for buttery garlic naan...',
  'Search for loaded cheesy pizzas...',
  'Search for aromatic chicken biryani...',
  'Search for classic double cheeseburgers...',
  'Search for hot sizzling noodles...',
  'Search for refreshing dynamic salads...',
  'Search for decadent chocolate lava cakes...'
]

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder,
  initialValue = '',
}) => {
  const [inputValue, setInputValue] = useState(initialValue)
  const [showDropdown, setShowDropdown] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { suggestions, loading } = useSearch(inputValue, 300)

  // Rotate placeholder text every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(inputValue)
    setShowDropdown(false)
  }

  const handleSuggestionClick = (val: string) => {
    setInputValue(val)
    onSearch(val)
    setShowDropdown(false)
  }

  const activePlaceholder = placeholder || PLACEHOLDERS[placeholderIndex]

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow backdrop behind input */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <input
          id="main-search-input"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={activePlaceholder}
          className="relative w-full pl-12 pr-12 py-4 rounded-full border border-white/20 focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/20 bg-white/10 backdrop-blur-md hover:bg-white/15 text-white placeholder-slate-300 shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-base"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400 select-none pointer-events-none">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Search className="w-5 h-5 text-teal-300" />}
        </div>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden max-h-60 overflow-y-auto animate-fade-in">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              type="button"
              className="w-full text-left px-6 py-3.5 hover:bg-teal-500/10 transition-colors text-slate-100 border-b border-white/5 last:border-b-0 flex items-center gap-3 hover:text-accent"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span className="font-medium">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
export default SearchBar

