'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { clsx } from 'clsx'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx(
            'absolute top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  icon?: ReactNode
}

export function DropdownMenuItem({ children, onClick, className, icon }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left',
        'text-slate-700 hover:bg-slate-50 transition-colors',
        className
      )}
    >
      {icon && <span className="text-slate-500">{icon}</span>}
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-slate-200" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {children}
    </div>
  )
}
