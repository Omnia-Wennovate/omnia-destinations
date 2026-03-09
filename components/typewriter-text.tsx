'use client'

import { useEffect, useRef } from 'react'
import Typewriter from 'typewriter-effect/dist/core'

interface TypewriterTextProps {
  text: string
  className?: string
  speed?: number
  highlightWords?: string[]
  highlightClassName?: string
}

export function TypewriterText({ 
  text, 
  className = '', 
  speed = 5,
  highlightWords = [],
  highlightClassName = 'text-primary'
}: TypewriterTextProps) {
  const typewriterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typewriterRef.current) {
      let displayText = text
      
      // Highlight multiple words
      if (highlightWords.length > 0) {
        highlightWords.forEach((word) => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi')
          displayText = displayText.replace(
            regex, 
            `<span class="${highlightClassName}">${word}</span>`
          )
        })
      }

      const typewriter = new Typewriter(typewriterRef.current, {
        delay: speed,
        cursor: '',
      })

      typewriter
        .typeString(displayText)
        .start()
    }
  }, [text, speed, highlightWords, highlightClassName])

  return <div ref={typewriterRef} className={className} />
}
