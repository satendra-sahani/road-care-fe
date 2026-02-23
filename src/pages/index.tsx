"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, ShoppingCart, User, Menu, X, Star, ChevronRight, ChevronLeft,
  Wrench, AlertTriangle, Truck, Phone, Shield, Clock, Zap, Heart,
  Home, Grid3X3, Receipt, Car, Bike, Settings, Battery, Fuel, Key,
  Headphones, Package, ArrowRight, Play, CircleDot, Plus,
} from "lucide-react";
const heroBanner ="https://ik.imagekit.io/aiwats/road-care/dummy-images/hero-banner.jpg"
const promoBanner = "https://ik.imagekit.io/aiwats/road-care/dummy-images/promo-banner.jpg"
const emergencyBanner = "https://ik.imagekit.io/aiwats/road-care/dummy-images/emergency-banner.jpg";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const banners = [
  { id: 1, image: heroBanner, title: "Expert Vehicle Service", subtitle: "Professional mechanics at your doorstep", cta: "Book Now" },
  { id: 2, image: promoBanner, title: "Spare Parts Sale", subtitle: "Up to 50% off on all vehicle parts", cta: "Shop Now" },
  { id: 3, image: emergencyBanner, title: "24/7 Emergency Help", subtitle: "Roadside assistance when you need it most", cta: "Get Help" },
];

const categories = [
  { icon: Settings, label: "Engine Parts", count: "250+" },
  { icon: CircleDot, label: "Brakes", count: "180+" },
  { icon: Zap, label: "Electrical", count: "120+" },
  { icon: CircleDot, label: "Tires", count: "300+" },
  { icon: Battery, label: "Batteries", count: "90+" },
  { icon: Fuel, label: "Oils & Fluids", count: "150+" },
  { icon: Car, label: "Car Accessories", count: "400+" },
  { icon: Bike, label: "Bike Accessories", count: "350+" },
];

const products = [
  { id: 1, name: "Ceramic Brake Pads Set", brand: "Brembo", price: 2499, mrp: 3999, rating: 4.5, reviews: 128, discount: 38, inStock: true, partNo: "BP-2024-C" },
  { id: 2, name: "Synthetic Engine Oil 5W-30", brand: "Castrol", price: 899, mrp: 1299, rating: 4.7, reviews: 256, discount: 31, inStock: true, partNo: "EO-5W30-1L" },
  { id: 3, name: "LED Headlight Bulb H4", brand: "Philips", price: 1599, mrp: 2499, rating: 4.3, reviews: 89, discount: 36, inStock: true, partNo: "HL-H4-LED" },
  { id: 4, name: "Alloy Wheel 17 inch", brand: "MRF", price: 4999, mrp: 7999, rating: 4.6, reviews: 67, discount: 38, inStock: false, partNo: "AW-17-SPT" },
  { id: 5, name: "Air Filter Performance", brand: "K&N", price: 1299, mrp: 1999, rating: 4.8, reviews: 312, discount: 35, inStock: true, partNo: "AF-KN-001" },
  { id: 6, name: "Spark Plug Iridium", brand: "NGK", price: 449, mrp: 699, rating: 4.4, reviews: 198, discount: 36, inStock: true, partNo: "SP-IRD-04" },
];

const services = [
  { icon: Wrench, title: "Book Mechanic", desc: "Home & roadside service", color: "primary" as const },
  { icon: AlertTriangle, title: "Emergency SOS", desc: "24/7 breakdown help", color: "accent" as const },
  { icon: Truck, title: "Track Orders", desc: "Real-time tracking", color: "info" as const },
  { icon: Shield, title: "Annual Maintenance", desc: "Complete vehicle care", color: "success" as const },
];

const brands = ["TVS", "Yamaha", "Bajaj", "Hero", "Honda", "Royal Enfield", "KTM", "3M", "Castrol", "Brembo"];

const emergencyServices = [
  { icon: Car, title: "Vehicle Breakdown", time: "15-30 mins", urgency: "High" },
  { icon: AlertTriangle, title: "Accident Assistance", time: "20-45 mins", urgency: "High" },
  { icon: CircleDot, title: "Flat Tire", time: "10-20 mins", urgency: "Medium" },
  { icon: Battery, title: "Battery Dead", time: "15-30 mins", urgency: "Medium" },
  { icon: Fuel, title: "Out of Fuel", time: "20-40 mins", urgency: "Medium" },
  { icon: Key, title: "Keys Locked", time: "15-25 mins", urgency: "Medium" },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const Index = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState("home");
  const [cartCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground"}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ─── TOP BAR (Desktop) ─── */}
      <div className="hidden md:block gradient-primary">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between text-primary-foreground text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +91 1800-123-4567</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Deliver to: Delhi, India</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Track Order</span>
            <span>Help & Support</span>
          </div>
        </div>
      </div>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground hidden sm:block">
              Road<span className="text-accent">Care</span>
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts, accessories, services..."
              className="pl-10 pr-4 bg-surface border-border focus:ring-2 focus:ring-accent/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-foreground">
            <a href="#" className="text-accent font-semibold">Home</a>
            <a href="#categories" className="hover:text-accent transition-colors">Categories</a>
            <a href="#products" className="hover:text-accent transition-colors">Products</a>
            <a href="#services" className="hover:text-accent transition-colors">Services</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-surface rounded-lg transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <User className="h-4 w-4" />
              Login
            </button>
            <button
              className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-3 animate-fade-in">
            <a href="#" className="block py-2 text-accent font-semibold">Home</a>
            <a href="#categories" className="block py-2 text-foreground hover:text-accent">Categories</a>
            <a href="#products" className="block py-2 text-foreground hover:text-accent">Products</a>
            <a href="#services" className="block py-2 text-foreground hover:text-accent">Services</a>
            <Button className="w-full gradient-primary text-primary-foreground">
              <User className="h-4 w-4 mr-2" /> Login / Register
            </Button>
          </div>
        )}
      </header>

      {/* ─── HERO BANNER CAROUSEL ─── */}
      <section className="relative overflow-hidden">
        <div className="relative h-[280px] sm:h-[400px] lg:h-[500px]">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === currentBanner ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 gradient-hero-overlay" />
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4 md:px-8">
                  <div className="max-w-lg space-y-4">
                    <Badge className="bg-accent text-accent-foreground border-none font-semibold px-3 py-1">
                      🔥 Limited Time Offer
                    </Badge>
                    <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
                      {banner.title}
                    </h1>
                    <p className="text-primary-foreground/80 text-base sm:text-lg">
                      {banner.subtitle}
                    </p>
                    <Button className="gradient-accent text-accent-foreground font-semibold px-6 py-3 h-auto text-base shadow-accent hover:opacity-90 transition-opacity">
                      {banner.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Nav arrows */}
          <button
            onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-card hidden sm:flex"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-card hidden sm:flex"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBanner(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentBanner ? "w-8 bg-accent" : "w-2.5 bg-primary-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUICK SERVICES ─── */}
      <section className="container mx-auto px-4 -mt-8 sm:-mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {services.map((service, idx) => {
            const bgMap = {
              primary: "gradient-primary",
              accent: "gradient-accent", 
              info: "bg-blue-500",
              success: "bg-green-500",
            };
            return (
              <button
                key={idx}
                className={`${bgMap[service.color]} rounded-xl p-4 sm:p-5 text-left shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className="h-10 w-10 rounded-lg bg-background/20 flex items-center justify-center mb-3">
                  <service.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-primary-foreground text-sm sm:text-base">{service.title}</h3>
                <p className="text-primary-foreground/70 text-xs sm:text-sm mt-1">{service.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section id="categories" className="container mx-auto px-4 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Find the right parts for your vehicle</p>
          </div>
          <Button variant="outline" className="hidden sm:flex border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className="bg-card rounded-xl p-4 sm:p-6 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border group"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-surface mx-auto mb-3 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <cat.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">{cat.label}</h3>
              <p className="text-muted-foreground text-xs mt-1">{cat.count} products</p>
            </button>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section id="products" className="bg-surface py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Top-rated parts & accessories</p>
            </div>
            <Button variant="outline" className="hidden sm:flex border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 md:overflow-visible md:pb-0">
            {products.map((product) => (
              <div
                key={product.id}
                className="min-w-[260px] md:min-w-0 bg-background rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Product Image Area */}
                <div className="relative h-48 bg-surface-dark flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                  {/* Discount Badge */}
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-none font-bold text-xs">
                    -{product.discount}%
                  </Badge>
                  <button className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors">
                    <Heart className="h-4 w-4 text-muted-foreground hover:text-accent transition-colors" />
                  </button>
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm font-semibold">Out of Stock</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wide">{product.brand}</p>
                  <h3 className="font-display font-semibold text-foreground text-sm mt-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Part: {product.partNo}</p>

                  <div className="flex items-center gap-1 mt-2">
                    {renderStars(product.rating)}
                    <span className="text-xs text-muted-foreground ml-1">({product.reviews})</span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="font-display font-bold text-lg text-foreground">₹{product.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground line-through">₹{product.mrp.toLocaleString()}</span>
                  </div>

                  <div className="mt-auto pt-3">
                    <Button
                      className={`w-full font-semibold text-sm h-10 ${
                        product.inStock
                          ? "gradient-accent text-accent-foreground shadow-accent hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRANDS MARQUEE ─── */}
      <section className="border-y border-border py-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <h3 className="font-display text-center text-lg font-semibold text-muted-foreground mb-6">Trusted by Top Brands</h3>
          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {brands.map((brand) => (
              <div key={brand} className="px-4 py-2 rounded-lg bg-surface text-foreground font-display font-bold text-sm sm:text-base hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMERGENCY SERVICES ─── */}
      <section className="container mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-3">🚨 Emergency Services</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Need Help Right Now?</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">24/7 emergency roadside assistance. Our mechanics reach you in minutes.</p>
        </div>

        {/* SOS Button */}
        <div className="flex justify-center mb-8">
          <button className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-destructive text-destructive-foreground font-display font-bold text-xl flex items-center justify-center animate-pulse-glow hover:scale-105 transition-transform">
            SOS
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {emergencyServices.map((service, idx) => (
            <button
              key={idx}
              className="bg-card rounded-xl p-4 border border-border hover:border-accent hover:shadow-card-hover transition-all duration-300 text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <service.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground text-sm">{service.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">ETA: {service.time}</p>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs ${
                      service.urgency === "High"
                        ? "border-destructive/30 text-destructive"
                        : "border-warning/30 text-warning"
                    }`}
                  >
                    {service.urgency} Priority
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="gradient-primary py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground text-center mb-10">Why Choose Road Care?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Genuine Parts", desc: "100% authentic products with warranty" },
              { icon: Truck, title: "Fast Delivery", desc: "Same day delivery available" },
              { icon: Headphones, title: "24/7 Support", desc: "Round the clock assistance" },
              { icon: Clock, title: "Easy Returns", desc: "Hassle-free 7-day returns" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-display font-bold text-primary-foreground text-sm sm:text-base">{item.title}</h3>
                <p className="text-primary-foreground/60 text-xs sm:text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP DOWNLOAD CTA ─── */}
      <section className="container mx-auto px-4 py-10 sm:py-16">
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-3">📱 Download App</Badge>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Get Road Care on Mobile</h2>
            <p className="text-muted-foreground mt-2 max-w-md">Book services, shop parts, and get emergency help — all from your phone. Available on Android & iOS.</p>
            <div className="flex gap-3 mt-6">
              <Button className="gradient-primary text-primary-foreground font-semibold px-6">
                <Play className="mr-2 h-4 w-4" /> Google Play
              </Button>
              <Button variant="outline" className="border-foreground text-foreground font-semibold px-6">
                App Store
              </Button>
            </div>
          </div>
          <div className="h-48 w-48 sm:h-56 sm:w-56 rounded-2xl gradient-primary flex items-center justify-center">
            <Car className="h-20 w-20 text-primary-foreground/30" />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <Car className="h-5 w-5 text-accent-foreground" />
                </div>
                <span className="font-display font-bold text-xl">
                  Road<span className="text-accent">Care</span>
                </span>
              </div>
              <p className="text-primary-foreground/60 text-sm">Your one-stop solution for vehicle parts, accessories, and professional services.</p>
            </div>
            {[
              { title: "Quick Links", links: ["Home", "Categories", "Products", "Services", "About Us"] },
              { title: "Customer Service", links: ["Track Order", "Returns", "FAQ", "Contact Us", "Feedback"] },
              { title: "Legal", links: ["Terms & Conditions", "Privacy Policy", "Shipping Policy", "Refund Policy"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-display font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-primary-foreground/60 text-sm hover:text-accent transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/40 text-sm">© 2026 Road Care. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="text-primary-foreground/40 text-sm hover:text-accent cursor-pointer transition-colors">Facebook</span>
              <span className="text-primary-foreground/40 text-sm hover:text-accent cursor-pointer transition-colors">Instagram</span>
              <span className="text-primary-foreground/40 text-sm hover:text-accent cursor-pointer transition-colors">Twitter</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Home, label: "Home", key: "home" },
            { icon: Grid3X3, label: "Categories", key: "categories" },
            { icon: Receipt, label: "Orders", key: "orders" },
            { icon: User, label: "Profile", key: "profile" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setMobileNav(item.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                mobileNav === item.key ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${mobileNav === item.key ? "fill-accent/20" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom spacing for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default Index;
