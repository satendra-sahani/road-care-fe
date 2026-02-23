"use client"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, ShoppingCart, User, Menu, X, Star, ChevronRight, ChevronLeft,
  Wrench, AlertTriangle, Truck, Phone, Shield, Clock, Zap, Heart,
  Home, Grid3X3, Receipt, Car, Bike, Settings, Battery, Fuel, Key,
  Headphones, Package, ArrowRight, Play, CircleDot, Plus, Disc, Cog,
  Circle, Construction, Droplet, BatteryCharging,
  Radio, Flower, FolderOpen, Grid, Filter, Sparkles, 
} from "lucide-react";

// Import mock data
import { 
  dummyParts, 
  categories, 
  brands, 
  banners, 
  mainCategories 
} from "@/data/userMockData";
const heroBanner ="https://ik.imagekit.io/aiwats/road-care/dummy-images/hero-banner.jpg"
const promoBanner = "https://ik.imagekit.io/aiwats/road-care/dummy-images/promo-banner.jpg"
const emergencyBanner = "https://ik.imagekit.io/aiwats/road-care/dummy-images/emergency-banner.jpg";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const herobanners = [
  { id: 1, image: heroBanner, title: "Expert Vehicle Service", subtitle: "Professional mechanics at your doorstep", cta: "Book Now" },
  { id: 2, image: promoBanner, title: "Spare Parts Sale", subtitle: "Up to 50% off on all vehicle parts", cta: "Shop Now" },
  { id: 3, image: emergencyBanner, title: "24/7 Emergency Help", subtitle: "Roadside assistance when you need it most", cta: "Get Help" },
];

// Icon mapping for categories
const categoryIcons = {
  "cog": Cog,
  "disc": Disc,
  "flash": Zap,
  "ellipse-outline": CircleDot,
  "bicycle": Bike,
  "water": Droplet,
  "battery-charging": BatteryCharging,
  "car-sport": Car,
  "car-outline": Car,
  "radio": Radio,
  "car-wash": Sparkles,
  "car-seat": Settings,
  "grid": Grid,
  "folder-outline": FolderOpen,
  "flower-outline": Flower,
  "car": Car,
  "construct": Construction,
};

const productCategories = categories.filter(cat => cat.parentCategory).map(cat => ({
  ...cat,
  icon: categoryIcons[cat.icon as keyof typeof categoryIcons] || Settings,
  count: dummyParts.filter(part => part.category === cat.id || 
    (cat.id.includes("engine") && part.category === "1") ||
    (cat.id.includes("brake") && part.category === "2") ||
    (cat.id.includes("electrical") && part.category === "3") ||
    (cat.id.includes("tyres") && part.category === "4") ||
    (cat.id.includes("body") && part.category === "5") ||
    (cat.id.includes("oils") && part.category === "7") ||
    (cat.id.includes("batteries") && part.category === "8")
  ).length + "+"
}));

const services = [
  { icon: Wrench, title: "Book Mechanic", desc: "Home & roadside service", color: "primary" as const },
  { icon: AlertTriangle, title: "Emergency SOS", desc: "24/7 breakdown help", color: "accent" as const },
  { icon: Truck, title: "Track Orders", desc: "Real-time tracking", color: "info" as const },
  { icon: Shield, title: "Annual Maintenance", desc: "Complete vehicle care", color: "success" as const },
];

const brandList = brands.map(brand => brand.name);

const emergencyServices = [
  { icon: Car, title: "Vehicle Breakdown", time: "15-30 mins", urgency: "High" },
  { icon: AlertTriangle, title: "Accident Assistance", time: "20-45 mins", urgency: "High" },
  { icon: CircleDot, title: "Flat Tire", time: "10-20 mins", urgency: "Medium" },
  { icon: Battery, title: "Battery Dead", time: "15-30 mins", urgency: "Medium" },
  { icon: Fuel, title: "Out of Fuel", time: "20-40 mins", urgency: "Medium" },
  { icon: Key, title: "Keys Locked", time: "15-25 mins", urgency: "Medium" },
];

// Products organized by categories (all 10 categories)
const productsByCategory = {
  all: dummyParts,
  brake: dummyParts.filter(p => p.category === "2"),
  oil: dummyParts.filter(p => p.category === "7"),
  tyres: dummyParts.filter(p => p.category === "4"),
  battery: dummyParts.filter(p => p.category === "8"),
  electrical: dummyParts.filter(p => p.category === "3"),
  airfilter: dummyParts.filter(p => ["27","28","29","30","31"].includes(String(p.id))),
  ignition: dummyParts.filter(p => ["32","33","34","35","36","37"].includes(String(p.id))),
  suspension: dummyParts.filter(p => p.category === "5"),
  cooling: dummyParts.filter(p => ["42","43","44","45","46","47"].includes(String(p.id))),
  transmission: dummyParts.filter(p => ["48","49","50","51","52"].includes(String(p.id))),
};

// Featured products (top-rated and in stock)
const featuredProducts = dummyParts.filter(p => p.inStock && p.rating >= 4.5).slice(0, 6);

// Best deals products (highest discount)
const bestDeals = dummyParts
  .filter(p => p.inStock)
  .sort((a, b) => ((b.mrp - b.price) / b.mrp) - ((a.mrp - a.price) / a.mrp))
  .slice(0, 8);

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const Index = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState("home");
  const [cartCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleProducts, setVisibleProducts] = useState(12);

  // Auto-rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % herobanners.length);
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

  const calculateDiscount = (price: number, mrp: number) => {
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const getCurrentProducts = () => {
    const products = selectedCategory === "all" ? dummyParts : productsByCategory[selectedCategory as keyof typeof productsByCategory] || [];
    return products.slice(0, visibleProducts);
  };

  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 12);
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
          {herobanners.map((banner, idx) => (
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
            onClick={() => setCurrentBanner((prev) => (prev - 1 + herobanners.length) % herobanners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-card hidden sm:flex"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => setCurrentBanner((prev) => (prev + 1) % herobanners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-card hidden sm:flex"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {herobanners.map((_, idx) => (
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

      {/* ─── MAIN CATEGORIES ─── */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Shop by Vehicle Type</h2>
          <p className="text-muted-foreground mt-1">Choose your vehicle category</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {mainCategories.map((category) => (
            <button
              key={category.id}
              className="bg-card rounded-xl p-6 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border group"
            >
              <div className="h-16 w-16 rounded-2xl bg-surface mx-auto mb-4 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <Car className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-2">{category.name}</h3>
              <p className="text-muted-foreground text-sm">{category.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section id="categories" className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Find the right parts for your vehicle</p>
          </div>
          <Button variant="outline" className="hidden sm:flex border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {productCategories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => {
                const catMap: Record<string, string> = {
                  "engine-2w": "airfilter", "brake-2w": "brake", "electrical-2w": "electrical",
                  "tyres-2w": "tyres", "body-2w": "suspension", "oils-2w": "oil", "batteries-2w": "battery",
                };
                setSelectedCategory(catMap[cat.id] || "all");
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-card rounded-xl p-4 sm:p-6 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border group"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-surface mx-auto mb-3 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <cat.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">{cat.name}</h3>
              <p className="text-muted-foreground text-xs mt-1">{cat.count} products</p>
            </button>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="bg-surface py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Top-rated parts & accessories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-background rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Product Image Area */}
                <div className="relative h-48 bg-surface-dark">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  {/* Discount Badge */}
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-none font-bold text-xs">
                    -{calculateDiscount(product.price, product.mrp)}%
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
                  <p className="text-xs text-muted-foreground mt-1">Part: {product.partNumber}</p>

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

      {/* ─── BEST DEALS ─── */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <Badge className="bg-accent/10 text-accent border-accent/20 mb-3">🔥 Best Deals</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Limited Time Offers</h2>
          <p className="text-muted-foreground mt-1">Grab these deals before they're gone</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestDeals.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              <div className="relative h-40 bg-surface-dark">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground border-none font-bold text-xs">
                  -{calculateDiscount(product.price, product.mrp)}% OFF
                </Badge>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p className="text-xs font-semibold text-accent uppercase">{product.brand}</p>
                <h3 className="font-display font-semibold text-foreground text-sm mt-1 line-clamp-2">{product.name}</h3>
                
                <div className="flex items-center gap-1 mt-2">
                  {renderStars(product.rating)}
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-display font-bold text-foreground">₹{product.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground line-through">₹{product.mrp.toLocaleString()}</span>
                </div>

                <Button className="w-full mt-3 gradient-accent text-accent-foreground text-xs h-8">
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ALL PRODUCTS ─── */}
      <section id="products" className="bg-surface py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">All Products</h2>
              <p className="text-muted-foreground mt-1">Complete range of auto parts & accessories</p>
            </div>
            
            {/* Category Filter - Scrollable */}
            <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 max-w-2xl">
              {[
                { key: "all", label: "All" },
                { key: "brake", label: "Brake" },
                { key: "oil", label: "Engine Oil" },
                { key: "tyres", label: "Tyres" },
                { key: "battery", label: "Battery" },
                { key: "electrical", label: "Electrical" },
                { key: "airfilter", label: "Air Filters" },
                { key: "ignition", label: "Ignition" },
                { key: "suspension", label: "Suspension" },
                { key: "cooling", label: "Cooling" },
                { key: "transmission", label: "Transmission" },
              ].map((cat) => (
                <Button
                  key={cat.key}
                  variant={selectedCategory === cat.key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.key)}
                  className="text-sm whitespace-nowrap shrink-0"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile Category Filter */}
          <div className="sm:hidden mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">All Products ({dummyParts.length})</option>
              <option value="brake">Brake System</option>
              <option value="oil">Engine Oil</option>
              <option value="tyres">Tyres</option>
              <option value="battery">Battery</option>
              <option value="electrical">Electrical</option>
              <option value="airfilter">Air Filters</option>
              <option value="ignition">Ignition System</option>
              <option value="suspension">Suspension</option>
              <option value="cooling">Cooling System</option>
              <option value="transmission">Transmission</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {getCurrentProducts().map((product) => (
              <div
                key={product.id}
                className="bg-background rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative h-48 bg-surface-dark">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-none font-bold text-xs">
                    -{calculateDiscount(product.price, product.mrp)}%
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
                  <p className="text-xs text-muted-foreground mt-1">Part: {product.partNumber}</p>

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

          {/* Load More Button */}
          {getCurrentProducts().length < (selectedCategory === "all" ? dummyParts.length : (productsByCategory[selectedCategory as keyof typeof productsByCategory] || []).length) && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMoreProducts}
                variant="outline" 
                className="px-8 py-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ─── BRANDS MARQUEE ─── */}
      <section className="border-y border-border py-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <h3 className="font-display text-center text-lg font-semibold text-muted-foreground mb-6">Trusted by Top Brands</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
            {brandList.slice(0, 8).map((brand) => (
              <div key={brand} className="text-center">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-surface mx-auto mb-2 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  <span className="font-display font-bold text-xs sm:text-sm">{brand.charAt(0)}</span>
                </div>
                <p className="text-xs font-medium text-foreground">{brand}</p>
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
