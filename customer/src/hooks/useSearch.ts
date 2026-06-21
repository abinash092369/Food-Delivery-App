import { useState, useEffect } from 'react'
import { searchApi } from '../api/search.api'

export const useSearch = (query: string, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(query)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(query)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [query, delay])

  useEffect(() => {
    if (!debouncedValue.trim()) {
      setSuggestions([])
      return
    }

    let isMounted = true;
    setLoading(true)

    searchApi
      .autocomplete(debouncedValue)
      .then((data) => {
        if (isMounted) {
          setSuggestions(data || [])
        }
      })
      .catch((err) => {
        console.error('Error fetching autocomplete suggestions', err)
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [debouncedValue])

  return {
    debouncedValue,
    suggestions,
    loading,
  }
}
export default useSearch
