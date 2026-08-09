import { useEffect, useRef, useState } from 'react'

export default function useHideOnScroll({ threshold = 10, initialVisible = true } = {}) {
  const [visible, setVisible] = useState(initialVisible)
  const lastY = useRef(0)

  useEffect(() => {
    if (typeof document === 'undefined') return
    
    function onScroll(e) {
      const target = e.target
      if (!target || !(target instanceof HTMLElement)) return
      
      const y = target.scrollTop || 0
      
      // Ignore bounces on mobile Safari/Chrome
      if (y < 0) return

      if (Math.abs(y - lastY.current) < threshold) return
      
      // Only hide if scrolled down past 60px to keep header visible at the top
      if (y > lastY.current && y > 60) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      lastY.current = y
    }

    // Capture scrolls on inner containers (like <main>)
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [threshold])

  return visible
}
