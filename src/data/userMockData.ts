// @ts-nocheck
import type { Part, Category, Order, ServiceRequest, Notification, MainCategory, Brand } from "../types"

export const mainCategories: MainCategory[] = [
  {
    id: "auto-accessories",
    name: "Auto Accessories",
    icon: "construct-outline",
    description: "Car accessories, seat covers, floor mats, dashboard items and more"
  },
  {
    id: "two-wheelers",
    name: "Two Wheelers",
    icon: "bicycle-outline",
    description: "Motorcycle and scooter parts, accessories and services"
  }
]

export const brands: Brand[] = [
  // Two Wheeler Brands
  { id: "tvs", name: "TVS", category: "two-wheelers", description: "TVS Motor Company parts and accessories", logo: "https://static.vecteezy.com/system/resources/previews/020/336/393/non_2x/tvs-logo-tvs-icon-transparent-png-free-vector.jpg" },
  { id: "yamaha", name: "YAMAHA", category: "two-wheelers", description: "Yamaha motorcycle parts and accessories", logo: "https://logos-world.net/wp-content/uploads/2020/06/Yamaha-Logo.png" },
  { id: "bajaj", name: "Bajaj", category: "two-wheelers", description: "Bajaj Auto parts and accessories", logo: "https://1000logos.net/wp-content/uploads/2020/07/Bajaj-logo.jpg" },
  { id: "hero", name: "Hero", category: "two-wheelers", description: "Hero MotoCorp parts and accessories", logo: "https://www.logo.wine/a/logo/Hero_MotoCorp/Hero_MotoCorp-Logo.wine.svg" },
  { id: "honda-2w", name: "Honda", category: "two-wheelers", description: "Honda Motorcycle parts and accessories", logo: "https://www.freepnglogos.com/uploads/honda-logo-png/honda-motorcycle-honda-logo-0.png" },
  { id: "royal-enfield", name: "Royal Enfield", category: "two-wheelers", description: "Royal Enfield parts and accessories", logo: "https://images.seeklogo.com/logo-png/42/1/royal-enfield-logo-png_seeklogo-425859.png" },
  { id: "ktm", name: "KTM", category: "two-wheelers", description: "KTM motorcycle parts and accessories", logo: "https://images.seeklogo.com/logo-png/8/1/ktm-racing-logo-png_seeklogo-80603.png" },
  
  // Auto Accessories Brands
  { id: "3m", name: "3M", category: "auto-accessories", description: "Car care and protection products", logo: "https://static.vecteezy.com/system/resources/previews/014/414/669/non_2x/3m-logo-on-transparent-background-free-vector.jpg" },
  { id: "meguiars", name: "Meguiar's", category: "auto-accessories", description: "Premium car care products", logo: "https://beachcitieswash.com/wp-content/uploads/2018/10/Amusing-Meguiars-Logo-47-In-Logo-Png-with-Meguiars-Logo-1.png" },
  { id: "chemical-guys", name: "Chemical Guys", category: "auto-accessories", description: "Professional car detailing products", logo: "https://brandlogos.net/wp-content/uploads/2022/05/chemical_guys-logo-brandlogos.net_-512x512.png" },
  { id: "mothers", name: "Mothers", category: "auto-accessories", description: "Car polish and cleaning products", logo: "https://mothers.com/cdn/shop/collections/33ebad748be1--img-logo-mothers-classic_a73cbff1-e455-4772-85d2-8f7a5a712548_1200x1200.png" },
  { id: "weathertech", name: "WeatherTech", category: "auto-accessories", description: "Floor mats and car protection", logo: "https://cdn.shopify.com/s/files/1/0620/4565/1108/files/WTCH.social.profile2.320x320.png" },
  { id: "covercraft", name: "Covercraft", category: "auto-accessories", description: "Custom car covers and seat covers", logo: "https://cdn.freebiesupply.com/logos/large/2x/covercraft-logo-png-transparent.png" },
  { id: "thule", name: "Thule", category: "auto-accessories", description: "Roof racks and cargo accessories", logo: "https://cdn.freebiesupply.com/logos/large/2x/thule-logo-png-transparent.png" },
  { id: "yakima", name: "Yakima", category: "auto-accessories", description: "Cargo and bike racks", logo: "https://logovectorseek.com/wp-content/uploads/2021/10/yakima-inc-logo-vector.png" }
]

export const categories: Category[] = [
  // Two Wheeler Categories
  { id: "engine-2w", name: "Engine Parts", icon: "cog", parentCategory: "two-wheelers" },
  { id: "brake-2w", name: "Brake System", icon: "disc", parentCategory: "two-wheelers" },
  { id: "electrical-2w", name: "Electrical", icon: "flash", parentCategory: "two-wheelers" },
  { id: "tyres-2w", name: "Tyres & Tubes", icon: "ellipse-outline", parentCategory: "two-wheelers" },
  { id: "body-2w", name: "Body Parts", icon: "bicycle", parentCategory: "two-wheelers" },
  { id: "oils-2w", name: "Oils & Lubricants", icon: "water", parentCategory: "two-wheelers" },
  { id: "batteries-2w", name: "Batteries", icon: "battery-charging", parentCategory: "two-wheelers" },
  
  // Auto Accessories Categories
  { id: "interior", name: "Interior Accessories", icon: "car-sport", parentCategory: "auto-accessories" },
  { id: "exterior", name: "Exterior Accessories", icon: "car-outline", parentCategory: "auto-accessories" },
  { id: "electronics", name: "Car Electronics", icon: "radio", parentCategory: "auto-accessories" },
  { id: "car-care", name: "Car Care Products", icon: "car-wash", parentCategory: "auto-accessories" },
  { id: "seat-covers", name: "Seat Covers", icon: "car-seat", parentCategory: "auto-accessories" },
  { id: "floor-mats", name: "Floor Mats", icon: "grid", parentCategory: "auto-accessories" },
  { id: "car-organizers", name: "Organizers", icon: "folder-outline", parentCategory: "auto-accessories" },
  { id: "perfumes", name: "Car Perfumes", icon: "flower-outline", parentCategory: "auto-accessories" },
  
  // Legacy categories for backward compatibility
  { id: "1", name: "Engine Parts", icon: "cog" },
  { id: "2", name: "Brake System", icon: "disc" },
  { id: "3", name: "Electrical", icon: "flash" },
  { id: "4", name: "Tyres & Tubes", icon: "ellipse-outline" },
  { id: "5", name: "Body Parts", icon: "car" },
  { id: "6", name: "Accessories", icon: "construct" },
  { id: "7", name: "Oils", icon: "water" },
  { id: "8", name: "Batteries", icon: "battery-charging" },
]

// ImageKit base URL
const IK = 'https://ik.imagekit.io/aiwats/road-care/dummy-images'

export const dummyParts: Part[] = [
  // ============ BRAKE SYSTEM (6 products) ============
  { id: 1, name: "Brake Pads", partNumber: "BP-101", brand: "Bosch", price: 350, mrp: 500, rating: 4.5, stock: "In Stock", images: [`${IK}/Brake%20Pads/bike_brake_pads.jpeg`, `${IK}/Brake%20Pads/bike_brake_pads_example_usage_1.jpeg`, `${IK}/Brake%20Pads/bike_brake_pads_example_usage_2.jpeg`, `${IK}/Brake%20Pads/bike_brake_pads_example_usage_3.jpeg`], category: "2", description: "High-performance brake pads for safe stopping. Premium friction material ensures consistent braking in all weather conditions.", specifications: ["Material: Semi-Metallic", "Position: Front/Rear", "Warranty: 6 months", "Low Dust Formula"], compatibility: ["TVS Apache", "Hero Splendor", "Bajaj Pulsar", "Honda CB Shine"], inStock: true, reviews: 189 },
  { id: 2, name: "Disc Brake Rotor", partNumber: "DBR-102", brand: "Brembo", price: 1200, mrp: 1650, rating: 4.7, stock: "In Stock", images: [`${IK}/Disc%20Brake%20Rotor%20-%20FrontRear/bike_disc_brake_rotor.jpeg`, `${IK}/Disc%20Brake%20Rotor%20-%20FrontRear/bike_disc_brake_rotor_usage_example_1.jpeg`, `${IK}/Disc%20Brake%20Rotor%20-%20FrontRear/bike_disc_brake_rotor_usage_example_2.jpeg`, `${IK}/Disc%20Brake%20Rotor%20-%20FrontRear/bike_disc_brake_rotor_usage_example_3.jpeg`], category: "2", description: "Precision-engineered disc brake rotor for front and rear wheels. Drilled design for better heat dissipation.", specifications: ["Material: Stainless Steel", "Type: Drilled", "Position: Front/Rear", "Warranty: 1 year"], compatibility: ["Bajaj Pulsar 150/200", "KTM Duke", "TVS Apache RTR"], inStock: true, reviews: 134 },
  { id: 3, name: "Brake Master Cylinder", partNumber: "BMC-103", brand: "Nissin", price: 950, mrp: 1300, rating: 4.4, stock: "In Stock", images: [`${IK}/Brake%20Master%20Cylinder/bike_brake_master_cylinder.jpeg`, `${IK}/Brake%20Master%20Cylinder/bike_brake_master_cylinder_example_usage_1`, `${IK}/Brake%20Master%20Cylinder/bike_brake_master_cylinder_example_usage_2.jpeg`, `${IK}/Brake%20Master%20Cylinder/bike_brake_master_cylinder_example_usage_3.jpeg`], category: "2", description: "OEM quality brake master cylinder assembly with reservoir. Provides smooth and consistent brake pressure.", specifications: ["Material: Aluminum Alloy", "Bore: 14mm", "Includes Reservoir", "Warranty: 6 months"], compatibility: ["Hero Splendor", "Honda Activa", "Bajaj Pulsar"], inStock: true, reviews: 98 },
  { id: 4, name: "Brake Caliper", partNumber: "BC-104", brand: "Nissin", price: 1800, mrp: 2400, rating: 4.6, stock: "In Stock", images: [`${IK}/Brake%20Caliper/bike_brake_caliper.jpeg`, `${IK}/Brake%20Caliper/bike_brake_caliper_example_usage_1.jpeg`, `${IK}/Brake%20Caliper/bike_brake_caliper_example_usage_2.jpeg`, `${IK}/Brake%20Caliper/bike_brake_caliper_example_usage_3.jpeg`], category: "2", description: "High-performance single-piston brake caliper for reliable stopping power.", specifications: ["Material: Aluminum", "Piston: Single", "Type: Floating", "Warranty: 1 year"], compatibility: ["KTM Duke 200/390", "Bajaj Dominar", "TVS Apache RR"], inStock: true, reviews: 76 },
  { id: 5, name: "Brake Lever", partNumber: "BL-105", brand: "ASV", price: 280, mrp: 400, rating: 4.3, stock: "In Stock", images: [`${IK}/Brake%20Lever/bike_brake_lever.jpeg`, `${IK}/Brake%20Lever/bike_brake_lever_example_usage_1.jpeg`], category: "2", description: "Adjustable brake lever with ergonomic design for comfortable braking.", specifications: ["Material: Aluminum Alloy", "Adjustable: 6 Positions", "Foldable Tip"], compatibility: ["Universal - Most Bikes"], inStock: true, reviews: 210 },
  { id: 6, name: "Brake Oil Reservoir", partNumber: "BOR-106", brand: "Nissin", price: 450, mrp: 650, rating: 4.2, stock: "In Stock", images: [`${IK}/Brake%20Oil%20Reservoir/bike_brake_reservoir.jpg`, `${IK}/Brake%20Oil%20Reservoir/bike_brake_reservoir_example_usage_1`], category: "2", description: "Transparent brake fluid reservoir for easy level monitoring.", specifications: ["Material: Polycarbonate", "Capacity: 45ml", "Transparent Body"], compatibility: ["Universal - Most Disc Brake Bikes"], inStock: true, reviews: 55 },
  // ============ ENGINE OIL (5 products) ============
  { id: 7, name: "Engine Oil 10W-40", partNumber: "EO-201", brand: "Castrol", price: 550, mrp: 750, rating: 4.7, stock: "In Stock", images: [`${IK}/Engine%20Oil%2010W-40%20Close%20View/bike_engine_oil_10w40.webp`, `${IK}/Engine%20Oil%2010W-40%20Close%20View/bike_engine_oil_10w40_example_usage_1.webp`, `${IK}/Engine%20Oil%2010W-40%20Close%20View/bike_engine_oil_10w40_example_usage_2.jpeg`, `${IK}/Engine%20Oil%2010W-40%20Close%20View/bike_engine_oil_10w40_example_usage_3.jpeg`], category: "7", description: "Premium 10W-40 engine oil for smooth engine performance.", specifications: ["Viscosity: 10W-40", "Volume: 1L", "Type: Semi-Synthetic", "API: SN Plus"], compatibility: ["All 4-Stroke Bikes", "Scooters"], inStock: true, reviews: 312 },
  { id: 8, name: "Motorcycle Engine Oil 1L", partNumber: "EO-202", brand: "Motul", price: 480, mrp: 650, rating: 4.6, stock: "In Stock", images: [`${IK}/Motorcycle%20Engine%20Oil%20Bottle%20(1L)/bike_engine_oil_1l.jpeg`, `${IK}/Motorcycle%20Engine%20Oil%20Bottle%20(1L)/bike_engine_oil_1l_example_usage_1.jpg`, `${IK}/Motorcycle%20Engine%20Oil%20Bottle%20(1L)/bike_engine_oil_1l_example_usage_2.jpeg`, `${IK}/Motorcycle%20Engine%20Oil%20Bottle%20(1L)/bike_engine_oil_1l_example_usage_3.jpeg`], category: "7", description: "High-quality motorcycle engine oil for daily use.", specifications: ["Volume: 1L", "Type: Mineral", "API: SL", "JASO: MA2"], compatibility: ["All Bikes", "Scooters", "Mopeds"], inStock: true, reviews: 267 },
  { id: 9, name: "Fully Synthetic Engine Oil", partNumber: "EO-203", brand: "Shell", price: 850, mrp: 1100, rating: 4.8, stock: "In Stock", images: [`${IK}/Fully%20Synthetic%20Bike%20Engine%20Oil/bike_engine_oil_fully_synthetic.jpeg`, `${IK}/Fully%20Synthetic%20Bike%20Engine%20Oil/bike_engine_oil_fully_synthetic_example_usage_1.jpg`, `${IK}/Fully%20Synthetic%20Bike%20Engine%20Oil/bike_engine_oil_fully_synthetic_example_usage_3.png`], category: "7", description: "Premium fully synthetic engine oil for maximum engine protection.", specifications: ["Viscosity: 10W-50", "Volume: 1L", "Type: Fully Synthetic", "API: SN"], compatibility: ["Sport Bikes", "Premium Motorcycles", "KTM", "Royal Enfield"], inStock: true, reviews: 198 },
  { id: 10, name: "Semi-Synthetic Engine Oil", partNumber: "EO-204", brand: "Castrol", price: 650, mrp: 850, rating: 4.5, stock: "In Stock", images: [`${IK}/Semi-Synthetic%20Engine%20Oil/bike_engine_oil_semi_synthetic.jpeg`, `${IK}/Semi-Synthetic%20Engine%20Oil/bike_engine_oil_semi_synthetic_example_usage_1.jpg`, `${IK}/Semi-Synthetic%20Engine%20Oil/bike_engine_oil_semi_synthetic_example_usage_2.jpeg`, `${IK}/Semi-Synthetic%20Engine%20Oil/bike_engine_oil_semi_synthetic_example_usage_3.jpeg`], category: "7", description: "Balanced semi-synthetic engine oil offering great value.", specifications: ["Viscosity: 10W-40", "Volume: 1L", "Type: Semi-Synthetic", "JASO: MA2"], compatibility: ["All 4-Stroke Bikes", "Commuter Bikes"], inStock: true, reviews: 223 },
  { id: 11, name: "Mineral Engine Oil 4T", partNumber: "EO-205", brand: "HP", price: 320, mrp: 450, rating: 4.3, stock: "In Stock", images: [`${IK}/Mineral%20Engine%20Oil%20(4T)/bike_engine_oil_mineral.jpeg`, `${IK}/Mineral%20Engine%20Oil%20(4T)/bike_engine_oil_mineral_example_usage_1.jpg`, `${IK}/Mineral%20Engine%20Oil%20(4T)/bike_engine_oil_mineral_example_usage_2.jpeg`, `${IK}/Mineral%20Engine%20Oil%20(4T)/bike_engine_oil_mineral_example_usage_3.jpeg`], category: "7", description: "Affordable mineral engine oil for everyday commuter bikes.", specifications: ["Viscosity: 20W-40", "Volume: 1L", "Type: Mineral", "4-Stroke"], compatibility: ["Hero Splendor", "Honda Shine", "Bajaj Platina", "TVS Star City"], inStock: true, reviews: 345 },
  // ============ TYRES (5 products) ============
  { id: 12, name: "Tubeless Bike Tyre", partNumber: "TY-301", brand: "MRF", price: 2200, mrp: 2800, rating: 4.6, stock: "In Stock", images: [`${IK}/Tubeless%20Bike%20Tyre/bike_tubeless_tyre.jpg`, `${IK}/Tubeless%20Bike%20Tyre/bike_tubeless_tyre_example_usage_1.png`, `${IK}/Tubeless%20Bike%20Tyre/bike_tubeless_tyre_example_usage_2.jpeg`, `${IK}/Tubeless%20Bike%20Tyre/bike_tubeless_tyre_example_usage_3.jpeg`], category: "4", description: "Premium tubeless tyre with excellent grip and durability.", specifications: ["Size: 100/90-17", "Type: Tubeless", "Pattern: All-Season", "Warranty: 5 years"], compatibility: ["Bajaj Pulsar", "TVS Apache", "Honda CB Shine", "Yamaha FZ"], inStock: true, reviews: 156 },
  { id: 13, name: "Front Tyre", partNumber: "TY-302", brand: "CEAT", price: 1800, mrp: 2400, rating: 4.4, stock: "In Stock", images: [`${IK}/Motorcycle%20Front%20Tyre/bike_front_tyre.jpeg`, `${IK}/Motorcycle%20Front%20Tyre/bike_front_tyre_example_usage_1.jpeg`, `${IK}/Motorcycle%20Front%20Tyre/bike_front_tyre_example_usage_2.jpeg`, `${IK}/Motorcycle%20Front%20Tyre/bike_front_tyre_example_usage_3.jpeg`], category: "4", description: "Durable front tyre with superior cornering stability.", specifications: ["Size: 80/100-18", "Type: Tubeless", "Position: Front", "Load Index: 47P"], compatibility: ["Most 150cc-200cc Bikes"], inStock: true, reviews: 112 },
  { id: 14, name: "Rear Tyre Wide Grip", partNumber: "TY-303", brand: "MRF", price: 2800, mrp: 3400, rating: 4.7, stock: "In Stock", images: [`${IK}/Motorcycle%20Rear%20Tyre%20(Wide%20Grip)/bike_rear_tyre.jpeg`, `${IK}/Motorcycle%20Rear%20Tyre%20(Wide%20Grip)/bike_rear_tyre_example_usage_1.jpg`, `${IK}/Motorcycle%20Rear%20Tyre%20(Wide%20Grip)/bike_rear_tyre_example_usage_2.jpeg`, `${IK}/Motorcycle%20Rear%20Tyre%20(Wide%20Grip)/bike_rear_tyre_example_usage_3.jpeg`], category: "4", description: "Wide grip rear tyre for enhanced traction at high speeds.", specifications: ["Size: 130/70-17", "Type: Tubeless", "Position: Rear", "Wide Tread"], compatibility: ["KTM Duke", "Bajaj Dominar", "TVS Apache RR 310"], inStock: true, reviews: 89 },
  { id: 15, name: "Off-Road Mud Grip Tyre", partNumber: "TY-304", brand: "Pirelli", price: 3200, mrp: 4000, rating: 4.5, stock: "In Stock", images: [`${IK}/Off-Road%20%20Mud%20Grip%20Tyre/bike_offroad_tyre.jpeg`, `${IK}/Off-Road%20%20Mud%20Grip%20Tyre/bike_offroad_tyre_example_usage_1.jpeg`, `${IK}/Off-Road%20%20Mud%20Grip%20Tyre/bike_offroad_tyre_example_usage_2.png`, `${IK}/Off-Road%20%20Mud%20Grip%20Tyre/bike_offroad_tyre_example_usage_3.jpg`], category: "4", description: "Aggressive tread pattern for maximum grip on mud and rough terrain.", specifications: ["Size: 110/90-19", "Type: Tube Type", "Terrain: Off-Road", "Knobby Pattern"], compatibility: ["Hero Xpulse", "Royal Enfield Himalayan", "KTM Adventure"], inStock: true, reviews: 67 },
  { id: 16, name: "Racing Performance Tyre", partNumber: "TY-305", brand: "Michelin", price: 4500, mrp: 5500, rating: 4.9, stock: "In Stock", images: [`${IK}/Racing%20%20Performance%20Tyre/bike_racing_tyre.jpeg`, `${IK}/Racing%20%20Performance%20Tyre/bike_racing_tyre_example_usage_1.png`, `${IK}/Racing%20%20Performance%20Tyre/bike_racing_tyre_example_usage_2.jpg`, `${IK}/Racing%20%20Performance%20Tyre/bike_racing_tyre_example_usage_3.webp`], category: "4", description: "Track-ready performance tyre with maximum grip.", specifications: ["Size: 120/70-17", "Type: Tubeless", "Compound: Soft", "Racing Grade"], compatibility: ["Sport Bikes", "KTM RC", "Yamaha R15/R3"], inStock: true, reviews: 45 },
  // ============ BATTERY (5 products) ============
  { id: 17, name: "Standard Battery 12V", partNumber: "BAT-401", brand: "Exide", price: 1600, mrp: 2100, rating: 4.6, stock: "In Stock", images: [`${IK}/Standard%20Motorcycle%20Battery%20(12V)/bike_battery_12v.jpeg`, `${IK}/Standard%20Motorcycle%20Battery%20(12V)/bike_battery_12v_example_usage_1.jpeg`, `${IK}/Standard%20Motorcycle%20Battery%20(12V)/bike_battery_12v_example_usage_2.jpeg`, `${IK}/Standard%20Motorcycle%20Battery%20(12V)/bike_battery_12v_example_usage_3.jpeg`], category: "8", description: "Reliable 12V motorcycle battery with excellent cold cranking.", specifications: ["Voltage: 12V", "Capacity: 7Ah", "Type: Lead-Acid", "Warranty: 18 months"], compatibility: ["All Bikes", "Scooters"], inStock: true, reviews: 234 },
  { id: 18, name: "Maintenance-Free Battery", partNumber: "BAT-402", brand: "Amaron", price: 2200, mrp: 2800, rating: 4.8, stock: "In Stock", images: [`${IK}/Maintenance-Free%20(MF)%20Bike%20Battery/bike_battery_mf.avif`, `${IK}/Maintenance-Free%20(MF)%20Bike%20Battery/bike_battery_mf_example_usage_1.png`, `${IK}/Maintenance-Free%20(MF)%20Bike%20Battery/bike_battery_mf_example_usage_2.jpeg`, `${IK}/Maintenance-Free%20(MF)%20Bike%20Battery/bike_battery_mf_example_usage_3.jpeg`], category: "8", description: "Zero-maintenance sealed battery. No water top-up needed.", specifications: ["Voltage: 12V", "Capacity: 9Ah", "Type: VRLA/MF", "Warranty: 24 months"], compatibility: ["All Bikes", "Scooters", "Premium Motorcycles"], inStock: true, reviews: 178 },
  { id: 19, name: "Lithium-Ion Battery", partNumber: "BAT-403", brand: "Antigravity", price: 4500, mrp: 5800, rating: 4.7, stock: "In Stock", images: [`${IK}/Lithium-Ion%20Motorcycle%20Battery/bike_battery_lithium.jpeg`, `${IK}/Lithium-Ion%20Motorcycle%20Battery/bike_battery_lithium_example_usage_1.jpg`, `${IK}/Lithium-Ion%20Motorcycle%20Battery/bike_battery_lithium_example_usage_2.jpeg`, `${IK}/Lithium-Ion%20Motorcycle%20Battery/bike_battery_lithium_example_usage_3.jpeg`], category: "8", description: "Ultra-lightweight lithium-ion battery. 70% lighter than lead-acid.", specifications: ["Voltage: 12.8V", "Capacity: 6Ah", "Type: LiFePO4", "Weight: 0.9kg", "Warranty: 3 years"], compatibility: ["Sport Bikes", "KTM", "Yamaha R Series"], inStock: true, reviews: 67 },
  { id: 20, name: "Dry Charged Battery", partNumber: "BAT-404", brand: "Exide", price: 1200, mrp: 1600, rating: 4.3, stock: "In Stock", images: [`${IK}/Dry%20Charged%20Battery/bike_battery_dry.jpeg`, `${IK}/Dry%20Charged%20Battery/bike_battery_dry_example_usage_1.jpeg`], category: "8", description: "Affordable dry charged battery with acid pack included.", specifications: ["Voltage: 12V", "Capacity: 5Ah", "Type: Dry Charged", "Acid Pack Included"], compatibility: ["Hero Splendor", "Honda CD 110", "Bajaj CT 100"], inStock: true, reviews: 145 },
  { id: 21, name: "Battery with Acid Pack", partNumber: "BAT-405", brand: "Amaron", price: 1400, mrp: 1800, rating: 4.4, stock: "In Stock", images: [`${IK}/Battery%20with%20Acid%20Pack%20(Traditional%20Type)/bike_battery_acid_pack.avif`, `${IK}/Battery%20with%20Acid%20Pack%20(Traditional%20Type)/bike_battery_acid_pack_example_usage_1.jpg`, `${IK}/Battery%20with%20Acid%20Pack%20(Traditional%20Type)/bike_battery_acid_pack_example_usage_3.jpg`], category: "8", description: "Traditional type battery with separate acid pack.", specifications: ["Voltage: 12V", "Capacity: 7Ah", "Type: Conventional", "Warranty: 12 months"], compatibility: ["All Commuter Bikes", "Scooters"], inStock: true, reviews: 112 },
  // ============ ELECTRICAL (5 products) ============
  { id: 22, name: "LED Headlight", partNumber: "EL-501", brand: "Philips", price: 650, mrp: 900, rating: 4.6, stock: "In Stock", images: [`${IK}/Motorcycle%20LED%20Headlight/bike_led_headlight.jpeg`, `${IK}/Motorcycle%20LED%20Headlight/bike_led_headlight_example_usage_1.jpeg`, `${IK}/Motorcycle%20LED%20Headlight/bike_led_headlight_example_usage_2.jpeg`, `${IK}/Motorcycle%20LED%20Headlight/bike_led_headlight_example_usage_3.jpg`], category: "3", description: "Ultra-bright LED headlight with H4 socket. 300% brighter than halogen.", specifications: ["Power: 35W", "Brightness: 4000 Lumens", "Color: 6000K White", "Warranty: 1 year"], compatibility: ["Most Bikes with H4 Socket"], inStock: true, reviews: 345 },
  { id: 23, name: "Indicator Turn Signal", partNumber: "EL-502", brand: "Generic", price: 350, mrp: 500, rating: 4.3, stock: "In Stock", images: [`${IK}/Bike%20Indicator%20%20Turn%20Signal/bike_indicator_light.jpeg`, `${IK}/Bike%20Indicator%20%20Turn%20Signal/bike_indicator_light_example_usage_1.jpeg`, `${IK}/Bike%20Indicator%20%20Turn%20Signal/bike_indicator_light_example_usage_2.avif`], category: "3", description: "Amber LED indicator/turn signal lights. Universal fit.", specifications: ["Type: LED", "Color: Amber", "Voltage: 12V", "Set of 2"], compatibility: ["Universal - Most Bikes"], inStock: true, reviews: 189 },
  { id: 24, name: "Wiring Harness", partNumber: "EL-503", brand: "OEM", price: 1200, mrp: 1600, rating: 4.4, stock: "In Stock", images: [`${IK}/Motorcycle%20Wiring%20Harness/bike_wiring_harness.jpeg`, `${IK}/Motorcycle%20Wiring%20Harness/bike_wiring_harness_example_usage_1.jpg`], category: "3", description: "Complete wiring harness assembly with all connectors.", specifications: ["Material: Copper", "Insulation: PVC", "Complete Set", "Weather Resistant"], compatibility: ["Model Specific - Please Verify"], inStock: true, reviews: 78 },
  { id: 25, name: "Regulator Rectifier", partNumber: "EL-504", brand: "Shindengen", price: 800, mrp: 1100, rating: 4.5, stock: "In Stock", images: [`${IK}/Regulator%20Rectifier/bike_regulator_rectifier.jpg`, `${IK}/Regulator%20Rectifier/bike_regulator_rectifier_example_usage_1.webp`, `${IK}/Regulator%20Rectifier/bike_regulator_rectifier_example_usage_2.jpg`, `${IK}/Regulator%20Rectifier/bike_regulator_rectifier_example_usage_3.avif`], category: "3", description: "Voltage regulator rectifier for stable electrical output.", specifications: ["Output: 12V DC", "Type: MOSFET", "Heat Sink: Aluminum", "Waterproof"], compatibility: ["Most 150cc-400cc Bikes"], inStock: true, reviews: 99 },
  { id: 26, name: "Stator Coil / Magneto", partNumber: "EL-505", brand: "OEM", price: 1500, mrp: 2000, rating: 4.4, stock: "In Stock", images: [`${IK}/Stator%20Coil%20%20Magneto%20Coil/bike_stator_coil.jpeg`, `${IK}/Stator%20Coil%20%20Magneto%20Coil/bike_stator_coil_example_usage_1.webp`, `${IK}/Stator%20Coil%20%20Magneto%20Coil/bike_stator_coil_example_usage_2.avif`, `${IK}/Stator%20Coil%20%20Magneto%20Coil/bike_stator_coil_example_usage_3.avif`], category: "3", description: "Stator coil assembly for charging system.", specifications: ["Type: 12-Pole", "Output: 12V AC", "Copper Wound", "OEM Spec"], compatibility: ["Model Specific - Check Fitment"], inStock: true, reviews: 56 },
  // ============ AIR FILTERS (5 products) ============
  { id: 27, name: "Paper Air Filter", partNumber: "AF-601", brand: "Hiflofiltro", price: 250, mrp: 380, rating: 4.3, stock: "In Stock", images: [`${IK}/Paper%20Air%20Filter%20Element/bike_air_filter_paper.jpeg`, `${IK}/Paper%20Air%20Filter%20Element/bike_air_filter_paper_example_usage_1.png`, `${IK}/Paper%20Air%20Filter%20Element/bike_air_filter_paper_example_usage_2.jpeg`, `${IK}/Paper%20Air%20Filter%20Element/bike_air_filter_paper_example_usage_3.jpeg`], category: "1", description: "OEM-grade paper air filter element. 99.5% filtration efficiency.", specifications: ["Material: Paper", "Filtration: 99.5%", "Disposable", "Replace every 10,000km"], compatibility: ["Honda", "Yamaha", "Suzuki", "TVS"], inStock: true, reviews: 278 },
  { id: 28, name: "Foam Air Filter", partNumber: "AF-602", brand: "UNI", price: 320, mrp: 450, rating: 4.4, stock: "In Stock", images: [`${IK}/Motorcycle%20Air%20Filter%20(Foam%20Type)/bike_air_filter_foam.jpg`, `${IK}/Motorcycle%20Air%20Filter%20(Foam%20Type)/bike_air_filter_foam_example_usage_1.png`, `${IK}/Motorcycle%20Air%20Filter%20(Foam%20Type)/bike_air_filter_foam_example_usage_2.jpg`, `${IK}/Motorcycle%20Air%20Filter%20(Foam%20Type)/bike_air_filter_foam_example_usage_3.jpg`], category: "1", description: "Washable and reusable foam air filter. Great for dusty conditions.", specifications: ["Material: Dual-Layer Foam", "Washable", "Reusable", "Oil-Treated"], compatibility: ["Hero Splendor", "Honda Activa", "TVS Jupiter"], inStock: true, reviews: 167 },
  { id: 29, name: "Performance Air Filter (Cone)", partNumber: "AF-603", brand: "K&N", price: 1200, mrp: 1600, rating: 4.7, stock: "In Stock", images: [`${IK}/Performance%20Air%20Filter%20(Cone%20Type)/bike_air_filter_performance.jpg`, `${IK}/Performance%20Air%20Filter%20(Cone%20Type)/bike_air_filter_performance_example_usage_1.jpeg`, `${IK}/Performance%20Air%20Filter%20(Cone%20Type)/bike_air_filter_performance_example_usage_2.jpeg`, `${IK}/Performance%20Air%20Filter%20(Cone%20Type)/bike_air_filter_performance_example_usage_3.jpeg`], category: "1", description: "High-flow cone air filter for increased horsepower.", specifications: ["Material: Cotton Gauze", "Type: Cone/Pod", "Washable", "Million Mile Warranty"], compatibility: ["Carbureted Bikes", "Modified Bikes"], inStock: true, reviews: 123 },
  { id: 30, name: "Universal Air Filter", partNumber: "AF-604", brand: "BMC", price: 450, mrp: 600, rating: 4.5, stock: "In Stock", images: [`${IK}/Universal%20Bike%20Air%20Filter/bike_air_filter_universal.jpeg`, `${IK}/Universal%20Bike%20Air%20Filter/bike_air_filter_universal_example_usage_1.jpeg`, `${IK}/Universal%20Bike%20Air%20Filter/bike_air_filter_universal_example_usage_2.jpeg`, `${IK}/Universal%20Bike%20Air%20Filter/bike_air_filter_universal_example_usage_3.jpeg`], category: "1", description: "Universal fit air filter compatible with most models.", specifications: ["Material: Multi-Layer", "Type: Universal", "Washable", "High Flow"], compatibility: ["Universal - Most 100cc-200cc Bikes"], inStock: true, reviews: 198 },
  { id: 31, name: "Air Filter Box Assembly", partNumber: "AF-605", brand: "OEM", price: 850, mrp: 1200, rating: 4.2, stock: "In Stock", images: [`${IK}/Air%20Filter%20Box%20%20Assembly/bike_air_filter_box.jpeg`, `${IK}/Air%20Filter%20Box%20%20Assembly/bike_air_filter_box_example_usage_1.png`, `${IK}/Air%20Filter%20Box%20%20Assembly/bike_air_filter_box_example_usage_2.jpg`, `${IK}/Air%20Filter%20Box%20%20Assembly/bike_air_filter_box_example_usage_3.jpg`], category: "1", description: "Complete air filter box with housing assembly.", specifications: ["Type: Complete Assembly", "Includes Filter Element", "OEM Fit", "ABS Housing"], compatibility: ["Model Specific - Check Fitment"], inStock: true, reviews: 45 },
  // ============ IGNITION SYSTEM (6 products) ============
  { id: 32, name: "Spark Plug", partNumber: "IG-701", brand: "NGK", price: 180, mrp: 250, rating: 4.7, stock: "In Stock", images: [`${IK}/Spark%20Plug/bike_spark_plug.jpeg`, `${IK}/Spark%20Plug/bike_spark_plug_example_usage_1.jpeg`, `${IK}/Spark%20Plug/bike_spark_plug_example_usage_2.jpeg`, `${IK}/Spark%20Plug/bike_spark_plug_example_usage_3.jpeg`], category: "1", description: "Iridium-tipped spark plug for reliable ignition.", specifications: ["Type: Iridium", "Thread: 12mm", "Gap: 0.7mm", "Heat Range: 7"], compatibility: ["Most 4-Stroke Bikes", "Scooters"], inStock: true, reviews: 456 },
  { id: 33, name: "Spark Plug Cap", partNumber: "IG-702", brand: "NGK", price: 120, mrp: 180, rating: 4.3, stock: "In Stock", images: [`${IK}/Spark%20Plug%20Cap/bike_spark_plug_cap`, `${IK}/Spark%20Plug%20Cap/bike_spark_plug_cap_example_usage_1.jpg`, `${IK}/Spark%20Plug%20Cap/bike_spark_plug_cap_example_usage_2.jpg`], category: "1", description: "Resistor-type spark plug cap for noise-free ignition.", specifications: ["Resistance: 5K Ohm", "Material: Rubber", "Waterproof", "Universal"], compatibility: ["Universal - Most Bikes"], inStock: true, reviews: 189 },
  { id: 34, name: "Ignition Coil", partNumber: "IG-703", brand: "Denso", price: 650, mrp: 900, rating: 4.5, stock: "In Stock", images: [`${IK}/Motorcycle%20Ignition%20Coil/bike_ignition_coil.jpeg`, `${IK}/Motorcycle%20Ignition%20Coil/bike_ignition_coil_example_usage_1.jpeg`, `${IK}/Motorcycle%20Ignition%20Coil/bike_ignition_coil_example_usage_3.avif`], category: "3", description: "High-voltage ignition coil for strong spark delivery.", specifications: ["Output: 30,000V", "Primary: 3 Ohm", "Type: Stick Coil", "OEM Quality"], compatibility: ["Honda", "Yamaha", "Bajaj"], inStock: true, reviews: 134 },
  { id: 35, name: "Ignition Switch & Key Set", partNumber: "IG-704", brand: "OEM", price: 550, mrp: 750, rating: 4.4, stock: "In Stock", images: [`${IK}/Ignition%20Switch%20%20Key%20Set/bike_ignition_switch.jpeg`, `${IK}/Ignition%20Switch%20%20Key%20Set/bike_ignition_switch_example_usage_1.png`, `${IK}/Ignition%20Switch%20%20Key%20Set/bike_ignition_switch_example_usage_2.jpeg`, `${IK}/Ignition%20Switch%20%20Key%20Set/bike_ignition_switch_example_usage_3.jpeg`], category: "3", description: "Complete ignition switch assembly with 2 keys.", specifications: ["Keys: 2 Included", "Positions: 3 (Off/On/Lock)", "Anti-Theft", "Waterproof"], compatibility: ["Model Specific"], inStock: true, reviews: 167 },
  { id: 36, name: "CDI Unit", partNumber: "IG-705", brand: "Denso", price: 750, mrp: 1000, rating: 4.3, stock: "In Stock", images: [`${IK}/CDI%20Unit%20(Capacitor%20Discharge%20Ignition)/bike_cdi_unit.jpeg`, `${IK}/CDI%20Unit%20(Capacitor%20Discharge%20Ignition)/bike_cdi_unit_example_usage_1.avif`, `${IK}/CDI%20Unit%20(Capacitor%20Discharge%20Ignition)/bike_cdi_unit_example_usage_2.avif`], category: "3", description: "Capacitor discharge ignition unit for precise timing.", specifications: ["Type: DC-CDI", "Input: 12V", "Programmable: No", "Plug & Play"], compatibility: ["Model Specific - Check Fitment"], inStock: true, reviews: 88 },
  { id: 37, name: "Ignition Switch Key Lock Set", partNumber: "IG-706", brand: "OEM", price: 900, mrp: 1200, rating: 4.5, stock: "In Stock", images: [`${IK}/Ignition%20Switch%20%20Key%20Lock%20Set/bike_ignition_switch_set.jpeg`, `${IK}/Ignition%20Switch%20%20Key%20Lock%20Set/bike_ignition_switch_set_example_usage_1.webp`, `${IK}/Ignition%20Switch%20%20Key%20Lock%20Set/bike_ignition_switch_set_example_usage_2.jpeg`, `${IK}/Ignition%20Switch%20%20Key%20Lock%20Set/bike_ignition_switch_set_example_usage_3.jpeg`], category: "3", description: "Complete lock set with ignition, fuel cap and seat lock.", specifications: ["Set: Ignition + Fuel Cap + Seat", "Keys: 2", "Single Key System", "Anti-Theft"], compatibility: ["Model Specific"], inStock: true, reviews: 112 },
  // ============ SUSPENSION (5 products) ============
  { id: 38, name: "Front Fork Suspension", partNumber: "SU-801", brand: "Showa", price: 3500, mrp: 4500, rating: 4.6, stock: "In Stock", images: [`${IK}/Front%20Fork%20%20Telescopic%20Suspension/bike_front_fork.jpeg`, `${IK}/Front%20Fork%20%20Telescopic%20Suspension/bike_front_fork_example_usage_1.jpeg`, `${IK}/Front%20Fork%20%20Telescopic%20Suspension/bike_front_fork_example_usage_2.jpeg`, `${IK}/Front%20Fork%20%20Telescopic%20Suspension/bike_front_fork_example_usage_3.jpeg`], category: "5", description: "Telescopic front fork assembly with progressive spring rate.", specifications: ["Type: Telescopic", "Travel: 130mm", "Dia: 37mm", "Oil Damped"], compatibility: ["Model Specific - Check Fitment"], inStock: true, reviews: 67 },
  { id: 39, name: "Rear Shock Absorber", partNumber: "SU-802", brand: "Gabriel", price: 1800, mrp: 2400, rating: 4.5, stock: "In Stock", images: [`${IK}/Rear%20Shock%20Absorber/bike_rear_shock_absorber.jpeg`, `${IK}/Rear%20Shock%20Absorber/bike_rear_shock_absorber_example_usage_1.jpeg`, `${IK}/Rear%20Shock%20Absorber/bike_rear_shock_absorber_example_usage_2.jpeg`, `${IK}/Rear%20Shock%20Absorber/bike_rear_shock_absorber_example_usage_3.jpeg`], category: "5", description: "Twin rear shock absorbers with adjustable preload.", specifications: ["Type: Twin Shock", "Preload: 5-Step", "Spring: Progressive", "Set of 2"], compatibility: ["Commuter Bikes", "Hero", "Honda", "Bajaj"], inStock: true, reviews: 123 },
  { id: 40, name: "Monoshock Suspension", partNumber: "SU-803", brand: "Ohlins", price: 5500, mrp: 7000, rating: 4.8, stock: "In Stock", images: [`${IK}/Monoshock%20Suspension/bike_monoshock.jpeg`, `${IK}/Monoshock%20Suspension/bike_monoshock_example_usage_1.jpeg`, `${IK}/Monoshock%20Suspension/bike_monoshock_example_usage_2.jpeg`], category: "5", description: "Premium monoshock with adjustable compression and rebound.", specifications: ["Type: Monoshock", "Adjustable: Compression + Rebound", "Gas Charged", "Aluminum Body"], compatibility: ["KTM Duke", "Bajaj Pulsar NS", "TVS Apache RR"], inStock: true, reviews: 56 },
  { id: 41, name: "Swing Arm", partNumber: "SU-804", brand: "OEM", price: 2800, mrp: 3600, rating: 4.4, stock: "In Stock", images: [`${IK}/Swing%20Arm/bike_swing_arm.jpg`, `${IK}/Swing%20Arm/bike_swing_arm_example_usage_1.jpeg`, `${IK}/Swing%20Arm/bike_swing_arm_example_usage_2.avif`], category: "5", description: "Box-section swing arm for improved rigidity.", specifications: ["Material: Steel", "Type: Box Section", "Surface: Powder Coated"], compatibility: ["Model Specific"], inStock: true, reviews: 34 },
  { id: 53, name: "Suspension Bush Kit", partNumber: "SU-805", brand: "Polyurethane Pro", price: 650, mrp: 850, rating: 4.5, stock: "In Stock", images: [`${IK}/Monoshock%20Suspension/bike_suspension_bush_kit.jpg`, `${IK}/Monoshock%20Suspension/bike_suspension_bush_kit_example_usage_1.webp`, `${IK}/Monoshock%20Suspension/bike_suspension_bush_kit_example_usage_2.avif`, `${IK}/Monoshock%20Suspension/bike_suspension_bush_kit_example_usage_3.jpg`], category: "5", description: "Premium polyurethane suspension bush kit.", specifications: ["Material: Polyurethane", "Set: Complete Kit", "Improved Handling", "Long-lasting"], compatibility: ["Model Specific"], inStock: true, reviews: 87 },
  // ============ COOLING SYSTEM (6 products) ============
  { id: 42, name: "Motorcycle Radiator", partNumber: "CS-901", brand: "Denso", price: 3200, mrp: 4200, rating: 4.6, stock: "In Stock", images: [`${IK}/Motorcycle%20Radiator/bike_radiator.jpeg`, `${IK}/Motorcycle%20Radiator/bike_radiator_example_usage_1.jpeg`, `${IK}/Motorcycle%20Radiator/bike_radiator_example_usage_2.jpeg`, `${IK}/Motorcycle%20Radiator/bike_radiator_example_usage_3.jpeg`], category: "1", description: "Aluminum core radiator for efficient engine cooling.", specifications: ["Material: Aluminum Core", "Rows: 2", "Includes Cap", "OEM Fitment"], compatibility: ["Liquid-Cooled Bikes", "KTM", "Bajaj Pulsar NS/RS"], inStock: true, reviews: 78 },
  { id: 43, name: "Radiator Hose Pipe", partNumber: "CS-902", brand: "Gates", price: 350, mrp: 500, rating: 4.3, stock: "In Stock", images: [`${IK}/Radiator%20Hose%20Pipe/bike_radiator_hose.jpg`, `${IK}/Radiator%20Hose%20Pipe/bike_radiator_hose_example_usage_1.webp`, `${IK}/Radiator%20Hose%20Pipe/bike_radiator_hose_example_usage_2.jpeg`, `${IK}/Radiator%20Hose%20Pipe/bike_radiator_hose_example_usage_3.jpg`], category: "1", description: "High-temperature silicone radiator hose.", specifications: ["Material: Silicone", "Temp Rating: 200°C", "Pressure: 2 Bar", "Reinforced"], compatibility: ["Model Specific"], inStock: true, reviews: 56 },
  { id: 44, name: "Radiator Cooling Fan", partNumber: "CS-903", brand: "Bosch", price: 1200, mrp: 1600, rating: 4.5, stock: "In Stock", images: [`${IK}/Radiator%20Cooling%20Fan/bike_radiator_fan.jpg`, `${IK}/Radiator%20Cooling%20Fan/bike_radiator_fan_example_usage_1.jpeg`, `${IK}/Radiator%20Cooling%20Fan/bike_radiator_fan_example_usage_2.jpg`, `${IK}/Radiator%20Cooling%20Fan/bike_radiator_fan_example_usage_3.jpg`], category: "1", description: "Electric radiator cooling fan with thermostat switch.", specifications: ["Voltage: 12V", "Blade: 6-inch", "Auto Thermostat", "Low Noise"], compatibility: ["Liquid-Cooled Bikes"], inStock: true, reviews: 89 },
  { id: 45, name: "Thermostat Valve", partNumber: "CS-904", brand: "Wahler", price: 450, mrp: 650, rating: 4.4, stock: "In Stock", images: [`${IK}/Thermostat%20Valve/bike_thermostat_valve.jpeg`, `${IK}/Thermostat%20Valve/bike_thermostat_valve_example_usage_1.webp`, `${IK}/Thermostat%20Valve/bike_thermostat_valve_example_usage_2.jpg`, `${IK}/Thermostat%20Valve/bike_thermostat_valve_example_usage_3.jpg`], category: "1", description: "Engine thermostat valve for optimal temperature regulation.", specifications: ["Opening Temp: 82°C", "Material: Brass + Wax", "OEM Spec"], compatibility: ["Liquid-Cooled Engines"], inStock: true, reviews: 45 },
  { id: 46, name: "Coolant Reservoir Tank", partNumber: "CS-905", brand: "OEM", price: 380, mrp: 550, rating: 4.2, stock: "In Stock", images: [`${IK}/Coolant%20Reservoir%20Tank/bike_coolant_reservoir.jpeg`, `${IK}/Coolant%20Reservoir%20Tank/bike_coolant_reservoir_example_usage_1.webp`, `${IK}/Coolant%20Reservoir%20Tank/bike_coolant_reservoir_example_usage_2.webp`, `${IK}/Coolant%20Reservoir%20Tank/bike_coolant_reservoir_example_usage_3.webp`], category: "1", description: "Overflow coolant reservoir tank with level markings.", specifications: ["Material: Transparent PP", "Capacity: 150ml", "Level Marks", "With Cap"], compatibility: ["Liquid-Cooled Bikes"], inStock: true, reviews: 34 },
  { id: 47, name: "Engine Coolant Liquid", partNumber: "CS-906", brand: "Motul", price: 350, mrp: 480, rating: 4.6, stock: "In Stock", images: [`${IK}/Engine%20Coolant%20Liquid%20Bottle/bike_engine_coolant.webp`, `${IK}/Engine%20Coolant%20Liquid%20Bottle/bike_engine_coolant_example_usage_1.webp`, `${IK}/Engine%20Coolant%20Liquid%20Bottle/bike_engine_coolant_example_usage_2.webp`, `${IK}/Engine%20Coolant%20Liquid%20Bottle/bike_engine_coolant_example_usage_3.jpg`], category: "7", description: "Pre-mixed engine coolant for liquid-cooled motorcycles.", specifications: ["Volume: 1L", "Type: Pre-Mixed", "Temp Range: -25°C to 135°C", "Green Color"], compatibility: ["All Liquid-Cooled Bikes"], inStock: true, reviews: 123 },
  // ============ TRANSMISSION (5 products) ============
  { id: 48, name: "Chain & Sprocket Kit", partNumber: "TR-1001", brand: "DID", price: 1500, mrp: 2000, rating: 4.6, stock: "In Stock", images: [`${IK}/Chain%20&%20Sprocket%20Kit/bike_chain_sprocket_kit.jpeg`, `${IK}/Chain%20&%20Sprocket%20Kit/bike_chain_sprocket_kit_example_usage_1.jpeg`, `${IK}/Chain%20&%20Sprocket%20Kit/bike_chain_sprocket_kit_example_usage_2.jpg`, `${IK}/Chain%20&%20Sprocket%20Kit/bike_chain_sprocket_kit_example_usage_3.webp`], category: "1", description: "Complete chain and sprocket kit. Heavy-duty O-ring chain.", specifications: ["Chain: 428 O-Ring", "Links: 118", "Front: 14T", "Rear: 42T"], compatibility: ["150cc-200cc Bikes"], inStock: true, reviews: 198 },
  { id: 49, name: "Clutch Plate Set", partNumber: "TR-1002", brand: "Newfren", price: 800, mrp: 1100, rating: 4.5, stock: "In Stock", images: [`${IK}/Motorcycle%20Clutch%20Plate%20Set/bike_clutch_plate_set.jpeg`, `${IK}/Motorcycle%20Clutch%20Plate%20Set/bike_clutch_plate_set_example_usage_1.jpeg`, `${IK}/Motorcycle%20Clutch%20Plate%20Set/bike_clutch_plate_set_example_usage_2.jpg`, `${IK}/Motorcycle%20Clutch%20Plate%20Set/bike_clutch_plate_set_example_usage_3.webp`], category: "1", description: "Complete friction and steel plate set for smooth clutch.", specifications: ["Set: Friction + Steel Plates", "Material: Cork Composite", "OEM Spec", "Complete Kit"], compatibility: ["Model Specific"], inStock: true, reviews: 145 },
  { id: 50, name: "Clutch Basket Housing", partNumber: "TR-1003", brand: "OEM", price: 2200, mrp: 2900, rating: 4.4, stock: "In Stock", images: [`${IK}/Clutch%20Basket%20%20Clutch%20Housing/bike_clutch_basket.jpeg`, `${IK}/Clutch%20Basket%20%20Clutch%20Housing/bike_clutch_basket_example_usage_1.jpeg`, `${IK}/Clutch%20Basket%20%20Clutch%20Housing/bike_clutch_basket_example_usage_2.jpeg`], category: "1", description: "Clutch basket/outer housing assembly. Precision machined.", specifications: ["Material: Aluminum Alloy", "CNC Machined", "OEM Replacement"], compatibility: ["Model Specific"], inStock: true, reviews: 34 },
  { id: 51, name: "Gear Box Assembly", partNumber: "TR-1004", brand: "OEM", price: 4500, mrp: 5800, rating: 4.3, stock: "In Stock", images: [`${IK}/Gear%20Box%20Assembly/bike_gearbox_assembly.jpg`, `${IK}/Gear%20Box%20Assembly/bike_gearbox_assembly_example_usage_1.jpeg`, `${IK}/Gear%20Box%20Assembly/bike_gearbox_assembly_example_usage_2.jpeg`, `${IK}/Gear%20Box%20Assembly/bike_gearbox_assembly_example_usage_3.jpeg`], category: "1", description: "Complete gearbox assembly with all gears and shafts.", specifications: ["Gears: 5-Speed", "Complete Assembly", "Heat Treated", "OEM Spec"], compatibility: ["Model Specific - Check Fitment"], inStock: true, reviews: 23 },
  { id: 52, name: "Gear Shift Lever", partNumber: "TR-1005", brand: "OEM", price: 350, mrp: 500, rating: 4.4, stock: "In Stock", images: [`${IK}/Gear%20Shift%20Lever/bike_gear_shift_lever.jpeg`, `${IK}/Gear%20Shift%20Lever/bike_gear_shift_lever_example_usage_1.jpeg`, `${IK}/Gear%20Shift%20Lever/bike_gear_shift_lever_example_usage_2.jpg`, `${IK}/Gear%20Shift%20Lever/bike_gear_shift_lever_example_usage_3.jpg`], category: "1", description: "Foldable gear shift lever with anti-slip rubber tip.", specifications: ["Material: Steel + Rubber", "Foldable Tip", "CNC Finish", "Universal Spline"], compatibility: ["Most Bikes"], inStock: true, reviews: 167 },
]

export const dummyOrders: Order[] = [
  {
    id: "ORD-001",
    items: [
      { part: dummyParts[0], quantity: 2 },
      { part: dummyParts[1], quantity: 1 },
    ],
    total: 1490,
    address: {
      id: "1",
      name: "Ramesh Kumar",
      mobile: "1111111111",
      addressLine1: "House No. 45, Main Road",
      addressLine2: "Near Police Station",
      landmark: "Opposite SBI Bank",
      city: "Hata",
      state: "Uttar Pradesh",
      pincode: "284001",
      isDefault: true,
    },
    status: "shipped",
    paymentMethod: "Cash on Delivery",
    deliveryPerson: {
      id: "DEL-001",
      name: "Suresh Yadav",
      mobile: "2222222222",
      rating: 4.5,
    },
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-16T14:20:00Z",
  },
]

export const dummyServiceRequests: ServiceRequest[] = [
  {
    id: "SR-001",
    serviceType: "roadside",
    vehicleType: "Bike",
    problem: "Engine not starting",
    location: "Hata, Kushingar (Main Market)",
    landmark: "Near Petrol Pump",
    date: "2024-01-20",
    timeSlot: "10:00 AM - 12:00 PM",
    status: "assigned",
    mechanic: {
      id: "MECH-001",
      name: "Vijay Singh",
      mobile: "9876543210",
      rating: 4.7,
      specialization: ["Engine", "Electrical"],
    },
    estimatedCharge: 500,
    createdAt: "2024-01-20T09:15:00Z",
  },
  {
    id: "SR-002",
    serviceType: "home",
    vehicleType: "Car",
    problem: "Brake issue and general service",
    location: "Hetimpur, Deoria (Left side of river)",
    landmark: "Near temple",
    date: "2024-01-21",
    timeSlot: "2:00 PM - 4:00 PM", 
    status: "on_way",
    mechanic: {
      id: "MECH-002",
      name: "Rajesh Kumar",
      mobile: "9876543211",
      rating: 4.5,
      specialization: ["Brake System", "General Service"],
    },
    estimatedCharge: 800,
    createdAt: "2024-01-21T11:30:00Z",
  },
  {
    id: "SR-003",
    serviceType: "roadside", 
    vehicleType: "Scooter",
    problem: "Puncture repair",
    location: "Bharkulwa Bazar",
    landmark: "Market entrance",
    date: "2024-01-22",
    timeSlot: "4:00 PM - 6:00 PM",
    status: "completed",
    mechanic: {
      id: "MECH-003",
      name: "Sunil Sharma",
      mobile: "9876543212",
      rating: 4.8,
      specialization: ["Tyre Repair", "Quick Service"],
    },
    estimatedCharge: 150,
    actualCharge: 120,
    createdAt: "2024-01-22T15:45:00Z",
  },
]

export const dummyNotifications: Notification[] = [
  {
    id: "NOT-001",
    title: "Order Shipped",
    message: "Your order ORD-001 has been shipped",
    type: "order",
    createdAt: "2024-01-16T14:20:00Z",
    read: false,
  },
  {
    id: "NOT-002",
    title: "Mechanic Assigned",
    message: "Vijay Singh is coming to help you",
    type: "service",
    createdAt: "2024-01-20T09:20:00Z",
    read: false,
  },
]

export const banners = [
  "https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png",
  "https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png",
  "https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png",
  "https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png",
  "https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png",
]