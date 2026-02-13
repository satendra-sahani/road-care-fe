'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [cartCount] = useState(3)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              RC
            </div>
            Road Care
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition">
              Shop
            </Link>
            <Link href="/service" className="text-foreground hover:text-primary transition">
              Service
            </Link>
            <Link href="/orders" className="text-foreground hover:text-primary transition">
              Orders
            </Link>
            <Link href="/profile" className="text-foreground hover:text-primary transition">
              Profile
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative">
              <ShoppingCart className="text-primary" size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <Link href="/" className="block py-2 text-foreground hover:text-primary">
              Shop
            </Link>
            <Link href="/service" className="block py-2 text-foreground hover:text-primary">
              Service
            </Link>
            <Link href="/orders" className="block py-2 text-foreground hover:text-primary">
              Orders
            </Link>
            <Link href="/profile" className="block py-2 text-foreground hover:text-primary">
              Profile
            </Link>
            <Button className="w-full mt-4 gap-2">
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
