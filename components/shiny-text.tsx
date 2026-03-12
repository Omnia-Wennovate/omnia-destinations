'use client'

import { motion } from 'motion/react'
import { CSSProperties } from 'react'

interface ShinyTextProps {
  text: string
  speed?: number
  delay?: number
  color?: string
  shineColor?: string
  spread?: number
  direction?: 'left' | 'right'
  yoyo?: boolean
  pauseOnHover?: boolean
  disabled?: boolean
  className?: string
}

export default function ShinyText({
  text,
  speed = 2,
  delay = 0,
  color = '#ffffff',
  shineColor = '#e5a832',
  spread = 120,
  direction = 'right',
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
  className = '',
}: ShinyTextProps) {
  const directionValue = direction === 'left' ? -1 : 1

  const shimmerVariants = {
    initial: {
      backgroundPosition: directionValue === 1 ? '-200%' : '200%',
    },
    animate: {
      backgroundPosition: directionValue === 1 ? '200%' : '-200%',
    },
  }

  const style: CSSProperties = {
    backgroundImage: `linear-gradient(
      90deg,
      ${color} 0%,
      ${color} ${40 - spread / 2}%,
      ${shineColor} 50%,
      ${color} ${60 + spread / 2}%,
      ${color} 100%
    )`,
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  }

  if (disabled) {
    return (
      <span className={className} style={{ color }}>
        {text}
      </span>
    )
  }

  return (
    <motion.span
      className={className}
      style={style}
      initial="initial"
      animate="animate"
      variants={shimmerVariants}
      transition={{
        duration: speed,
        delay,
        repeat: yoyo ? Number.POSITIVE_INFINITY : 0,
        repeatType: 'reverse',
        ease: 'linear',
      }}
      whileHover={pauseOnHover ? { backgroundPosition: '0%' } : undefined}
    >
      {text}
    </motion.span>
  )
}
