import { clsx } from 'clsx'
import { User } from 'lucide-react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div
      className={clsx(
        'relative rounded-full overflow-hidden flex items-center justify-center',
        'bg-gradient-to-br from-sky-500 to-blue-600 text-white font-semibold',
        'ring-2 ring-white shadow-md',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image src={src} alt={alt || 'Avatar'} fill className="object-cover" />
      ) : fallback ? (
        <span>{getInitials(fallback)}</span>
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
    </div>
  )
}
