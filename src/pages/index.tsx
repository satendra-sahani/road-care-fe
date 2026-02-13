'use client'

import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DUMMY_CATEGORIES, DUMMY_PARTS } from '@/lib/constants'
import { Star, ArrowRight, AlertCircle, Package, Wrench } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const featuredParts = DUMMY_PARTS.slice(0, 6)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                Your Complete Auto Care Solution
              </h1>
              <p className="text-lg text-white/90 mb-8">
                Quality spare parts and professional mechanic services at your doorstep
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/shop">
                  <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90">
                    Shop Parts <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link href="/service">
                  <Button size="lg" variant="outline" className="gap-2 bg-white text-primary hover:bg-white/90">
                    <Wrench size={20} /> Request Service
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg h-64 md:h-80 flex items-center justify-center">
              <div className="text-white text-6xl">🚗</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-l-4 border-l-secondary">
              <div className="flex items-center gap-4">
                <Package className="text-secondary" size={32} />
                <div>
                  <h3 className="font-bold">1000+ Parts</h3>
                  <p className="text-sm text-muted-foreground">Premium quality parts</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-center gap-4">
                <Wrench className="text-primary" size={32} />
                <div>
                  <h3 className="font-bold">Expert Mechanics</h3>
                  <p className="text-sm text-muted-foreground">Certified professionals</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-l-destructive">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-destructive" size={32} />
                <div>
                  <h3 className="font-bold">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">Emergency assistance</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
            <p className="text-muted-foreground">Browse our extensive collection of auto parts</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {DUMMY_CATEGORIES.map((category) => (
              <Link key={category.id} href={`/shop?category=${category.id}`}>
                <Card className="p-6 text-center hover:shadow-lg hover:border-primary transition cursor-pointer">
                  <div className="text-4xl mb-3">
                    {category.name.includes('Engine') && '⚙️'}
                    {category.name.includes('Brake') && '🛑'}
                    {category.name.includes('Suspension') && '🔧'}
                    {category.name.includes('Electrical') && '⚡'}
                    {category.name.includes('Accessories') && '🎁'}
                  </div>
                  <h3 className="font-bold text-sm">{category.name}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Featured Parts</h2>
            <p className="text-muted-foreground">Our best selling and most rated products</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredParts.map((part) => (
              <Link key={part.id} href={`/shop/${part.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition h-full">
                  <div className="bg-muted h-40 flex items-center justify-center text-4xl">📦</div>
                  <div className="p-4">
                    <h3 className="font-bold line-clamp-2">{part.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{part.brand}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(part.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({part.reviews})</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">₹{part.price}</span>
                      <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/shop">
              <Button size="lg" variant="outline">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Professional Service?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Our network of certified mechanics is ready to help with any car maintenance or repair needs
          </p>
          <Link href="/service/new">
            <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
              <Wrench size={20} /> Request a Mechanic
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Road Care</h4>
              <p className="text-white/70 text-sm">Your trusted partner for all automotive needs</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/shop">Shop Parts</Link></li>
                <li><Link href="/service">Services</Link></li>
                <li><Link href="/orders">Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-white/70 text-sm">Email: support@roadcare.com</p>
              <p className="text-white/70 text-sm">Phone: 1-800-ROADCARE</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/70 text-sm">
            <p>&copy; 2024 Road Care. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
