import { ShopListing } from '@/components/shop/ShopListing'

export default function Shop() {
  return <ShopListing />
}
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 5000])

  const filteredParts = DUMMY_PARTS.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || part.category === selectedCategory
    const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1]
    return matchesSearch && matchesCategory && matchesPrice
  })

  const sortedParts = [...filteredParts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price
      case 'price_high':
        return b.price - a.price
      case 'rating':
        return b.rating - a.rating
      default:
        return b.reviews - a.reviews
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Shop Auto Parts</h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted" size={20} />
              <Input
                placeholder="Search parts, brands..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} /> Filters
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          {(showFilters || window.innerWidth >= 1024) && (
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="font-bold mb-4 flex items-center justify-between">
                    Categories
                    {showFilters && (
                      <button
                        onClick={() => setShowFilters(false)}
                        className="lg:hidden"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`block w-full text-left p-2 rounded ${
                        selectedCategory === null
                          ? 'bg-primary text-white'
                          : 'hover:bg-muted'
                      }`}
                    >
                      All Parts
                    </button>
                    {DUMMY_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`block w-full text-left p-2 rounded text-sm ${
                          selectedCategory === cat.name
                            ? 'bg-primary text-white'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-bold mb-4">Price Range</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Min: ₹{priceRange[0]}</label>
                      <Input
                        type="range"
                        min="0"
                        max="5000"
                        step="100"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Max: ₹{priceRange[1]}</label>
                      <Input
                        type="range"
                        min="0"
                        max="5000"
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="font-bold mb-4">Sort By</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'popular', label: 'Popular' },
                      { value: 'price_low', label: 'Price: Low to High' },
                      { value: 'price_high', label: 'Price: High to Low' },
                      { value: 'rating', label: 'Highest Rated' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`block w-full text-left p-2 rounded text-sm ${
                          sortBy === option.value
                            ? 'bg-primary text-white'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing {sortedParts.length} products
              </p>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden bg-transparent"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} /> Filters
              </Button>
            </div>

            {sortedParts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No products found matching your criteria</p>
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory(null)
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {sortedParts.map((part) => (
                  <Link key={part.id} href={`/shop/${part.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition h-full flex flex-col">
                      <div className="bg-muted h-48 flex items-center justify-center text-5xl relative">
                        📦
                        <div className="absolute top-3 right-3 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold">
                          ₹{part.price}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold line-clamp-2 mb-1">{part.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{part.brand}</p>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.floor(part.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted'
                                }
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({part.reviews} reviews)
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4">
                          {part.stock > 0 ? (
                            <span className="text-primary font-semibold">In Stock ({part.stock})</span>
                          ) : (
                            <span className="text-destructive">Out of Stock</span>
                          )}
                        </p>

                        <Button className="w-full mt-auto bg-secondary hover:bg-secondary/90">
                          Add to Cart
                        </Button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
