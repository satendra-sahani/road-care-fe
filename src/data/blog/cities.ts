import type { DistrictKey, Faq } from './types'

/* ────────────────────────────────────────────────────────────────────────────
 * Service-area data for the city guides.
 * Facts kept deliberately conservative (district, tehsil/block/nagar panchayat
 * status, well-known highways, stations and landmarks). Sources: district
 * portals kushinagar.nic.in / deoria.nic.in and Wikipedia district pages.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface District {
  key: DistrictKey
  name: string
  hi: string
  /** One-line context used in every city page of the district. */
  context: string
  roads: string
  rivers: string
  /** Month-by-month vehicle-care notes specific to the district. */
  seasons: { when: string; what: string }[]
}

export const DISTRICTS: Record<DistrictKey, District> = {
  gorakhpur: {
    key: 'gorakhpur',
    name: 'Gorakhpur',
    hi: 'गोरखपुर',
    context: 'Gorakhpur is the divisional headquarters and the busiest vehicle market of eastern Uttar Pradesh, with traffic flowing in from Deoria, Kushinagar, Maharajganj, Basti and the Nepal border.',
    roads: 'NH-27, the Gorakhpur Link Expressway and the Gorakhpur–Deoria and Gorakhpur–Maharajganj roads',
    rivers: 'the Rapti and Rohini rivers',
    seasons: [
      { when: 'June – September (monsoon)', what: 'Low-lying colonies and underpasses waterlog quickly. Check wiper blades, brake response after wading, and never crank an engine that has taken water — call for a tow instead.' },
      { when: 'October – November (festive rush)', what: 'Diwali and Chhath traffic doubles city congestion. Get the periodic service, AC check and tyre pressure done before the rush, not during it.' },
      { when: 'December – January (fog)', what: 'Dense fog on NH-27 and the Link Expressway. Clean headlamps, working fog/hazard lamps and fresh wiper fluid matter more than speed.' },
      { when: 'April – June (peak summer)', what: 'Cabin AC and engine cooling work hardest. Top up coolant, clean the AC condenser and keep the battery terminals free of corrosion.' },
    ],
  },
  deoria: {
    key: 'deoria',
    name: 'Deoria',
    hi: 'देवरिया',
    context: 'Deoria district sits between Gorakhpur, Kushinagar and the Bihar border, and its towns are tied together by the Gorakhpur–Deoria and Deoria–Kasia roads and the Gorakhpur–Siwan rail line.',
    roads: 'the Gorakhpur–Deoria road, the Deoria–Kasia road and the Salempur and Bhatpar Rani routes towards Bihar',
    rivers: 'the Ghaghara, Rapti and Chhoti Gandak rivers',
    seasons: [
      { when: 'July – September (floods)', what: 'Ghaghara and Rapti flood warnings can close low roads. Keep an emergency number saved, avoid wading deep water and get electricals checked after any water entry.' },
      { when: 'October – November (festive travel)', what: 'Families drive to Gorakhpur, Bihar and back for Diwali and Chhath. Tyres, brakes, lights and a battery test are the four checks that prevent most breakdowns.' },
      { when: 'November – April (cane season)', what: 'Slow, loaded tractor-trolleys and mud on village roads. Keep brakes sharp, tyres healthy and headlamps aligned for night driving.' },
      { when: 'April – June (heat)', what: 'Two-wheelers overheat in traffic and car ACs lose gas. An oil change and an AC service before May saves money later.' },
    ],
  },
  kushinagar: {
    key: 'kushinagar',
    name: 'Kushinagar',
    hi: 'कुशीनगर',
    context: 'Kushinagar district runs from the Buddhist pilgrimage town of Kushinagar up to the Gandak river and the Bihar border, with Padrauna as its headquarters and NH-27 as its main artery.',
    roads: 'NH-27 and NH-727, plus the Padrauna–Kasia, Kasia–Deoria and Kaptanganj–Ramkola roads',
    rivers: 'the Gandak (Narayani) river and its flood plains',
    seasons: [
      { when: 'July – September (Gandak floods)', what: 'Riverside villages can be cut off for days. Service the vehicle before the monsoon and keep a spare, jack and tow rope in the boot.' },
      { when: 'October – February (pilgrim season)', what: 'Tourist taxis and buses to the Mahaparinirvana Temple peak. Commercial drivers should schedule oil changes and brake checks around the season, not in the middle of it.' },
      { when: 'November – April (sugarcane crushing)', what: 'Kushinagar is a sugarcane belt, so crushing season means overloaded trolleys, spilled cane and slippery mud. Good tyres and brakes are non-negotiable.' },
      { when: 'December – January (fog)', what: 'Visibility on NH-27 can drop to a few metres at dawn. Working headlamps, clean glass and hazard lamps are the minimum.' },
    ],
  },
  maharajganj: {
    key: 'maharajganj',
    name: 'Maharajganj',
    hi: 'महराजगंज',
    context: 'Maharajganj district lies north of Gorakhpur along the Nepal border, with Sonauli as the main crossing and a mix of forest, farm and highway driving.',
    roads: 'the Gorakhpur–Maharajganj road and the highway to the Sonauli border',
    rivers: 'the Rohini river and the Terai streams near the Nepal border',
    seasons: [
      { when: 'July – September (Terai rains)', what: 'Heavy rain near the foothills floods low roads fast. Check tyres, wipers and brakes before the season starts.' },
      { when: 'October – November (festivals)', what: 'Cross-border and festive traffic peaks. A periodic service and battery test avoid breakdowns on the long runs to Gorakhpur.' },
      { when: 'November – April (cane season)', what: 'Sugarcane trolleys crowd the roads around mill towns. Keep headlamps aligned and brakes responsive.' },
      { when: 'December – January (fog)', what: 'Forest stretches and highways fog over early. Slow down and make sure every lamp works.' },
    ],
  },
}

export interface City {
  slug: string // used as /blog/mechanic-in-{slug}
  name: string
  hi: string
  district: DistrictKey
  /** What the place is, administratively — shown in the facts box. */
  admin: string
  /** Main city/town (1), town (2), block/village (3). Drives sitemap priority and ordering. */
  tier: 1 | 2 | 3
  intro: string
  /** Two short paragraphs on local driving conditions — unique per place. */
  local: [string, string]
  faq: Faq
  nearby: string[]
  /** Neighbourhoods served (bigger cities only). */
  areas?: string[]
}

export const CITIES: City[] = [
  /* ═══════════════════════ GORAKHPUR DISTRICT ═══════════════════════ */
  {
    slug: 'gorakhpur', name: 'Gorakhpur', hi: 'गोरखपुर', district: 'gorakhpur', admin: 'Divisional & district headquarters', tier: 1,
    intro: 'Gorakhpur is the biggest vehicle market in Purvanchal, and also one of the hardest cities to find a mechanic you can trust at short notice. Between the Golghar market traffic, the Medical College road, the Gorakhnath Temple crowds and the new Link Expressway, cars and bikes here do a lot of stop-and-go city running and fast highway running in the same week. Bharat Mechanics brings certified mechanics to your home, office or roadside in Gorakhpur, with prices shown before you book and payment only after the work is done.',
    local: [
      'City driving in Gorakhpur is dominated by e-rickshaw traffic, crowded chowks and long signal waits around Golghar, Betiahata, Mohaddipur and Asuran. That pattern wears clutch plates, brake pads and engine oil faster than the kilometres suggest, so city cars benefit from an oil change and brake check every 5,000–7,500 km rather than waiting for the full service interval.',
      'The Gorakhpur Link Expressway and NH-27 bypass have changed how people drive out of the city: longer runs at steady high speed. Before a highway trip, tyre pressure (including the spare), wheel alignment and coolant level are the checks that matter most. In the monsoon, underpasses and low colonies waterlog quickly — if water reaches the door sills, do not restart the engine; book roadside help instead.',
    ],
    faq: { q: 'Which areas of Gorakhpur do your mechanics cover?', a: 'We take bookings across Gorakhpur city — including Golghar, Betiahata, Mohaddipur, Rustampur, Taramandal, Asuran, Shahpur, Kunraghat, Padri Bazar, Medical College road and the Gorakhnath area — and on the highways leading out of the city. Enter your address at booking to see the available slot and arrival time.' },
    nearby: ['chauri-chaura', 'kushmi-bazar', 'pipraich', 'sahjanwa', 'maharajganj', 'hata'],
    areas: ['Golghar', 'Betiahata', 'Mohaddipur', 'Rustampur', 'Taramandal', 'Asuran', 'Shahpur', 'Kunraghat', 'Padri Bazar', 'Medical College Road', 'Gorakhnath', 'Humayunpur'],
  },
  {
    slug: 'chauri-chaura', name: 'Chauri Chaura', hi: 'चौरी चौरा', district: 'gorakhpur', admin: 'Town & tehsil, Gorakhpur district', tier: 2,
    intro: 'Chauri Chaura is known across India for the 1922 incident that changed the course of the freedom movement, and today it is a busy town on the road between Gorakhpur and Deoria. Most families here run a motorcycle for daily work and a car for trips into Gorakhpur. Bharat Mechanics sends verified mechanics to Chauri Chaura for doorstep servicing, repairs and roadside help, so you do not have to lose a day travelling to a city workshop.',
    local: [
      'Traffic on the Gorakhpur–Deoria corridor mixes buses, trucks, tractors and two-wheelers, and the market stretch around the station gets crowded in the evenings. Bikes that do this daily run need regular chain lubrication, brake adjustment and an oil change every 2,500–3,000 km.',
      'Many village roads around Chauri Chaura turn dusty in summer and muddy in the monsoon. Dust clogs air filters quickly — a clogged filter alone can cut mileage noticeably — so ask for an air-filter clean on every service visit.',
    ],
    faq: { q: 'Can I get a mechanic at home in Chauri Chaura?', a: 'Yes. Book online or call us, choose doorstep service and a verified mechanic comes to your address in and around Chauri Chaura. Jobs that need a workshop (like major denting) are picked up and returned.' },
    nearby: ['gorakhpur', 'kushmi-bazar', 'gauri-bazar', 'deoria', 'pipraich'],
  },
  {
    slug: 'kushmi-bazar', name: 'Kushmi Bazar', hi: 'कुसम्ही बाजार', district: 'gorakhpur', admin: 'Market town (Kusmhi), Gorakhpur district', tier: 3,
    intro: 'Kushmi Bazar (Kusmhi) sits on the Gorakhpur–Deoria road beside the Kusmhi forest, home of the well-known Budhiya Mai temple. It is a quick stop for travellers and a daily base for people who commute into Gorakhpur. When a vehicle gives trouble on this stretch, Bharat Mechanics can send a mechanic to Kushmi Bazar or book a tow to the nearest workshop.',
    local: [
      'The forest stretch near Kusmhi is darker and quieter than the rest of the corridor, which makes a roadside breakdown at night stressful. Weak batteries and worn headlamp bulbs are the most common causes of night-time trouble here, and both are cheap to check during a routine service.',
      'Fast highway traffic mixed with slow local vehicles means brakes and tyres take the strain. If your car pulls to one side or the steering vibrates at speed, book a wheel alignment and balancing before your next long drive.',
    ],
    faq: { q: 'My car broke down near Kusmhi forest at night. What should I do?', a: 'Pull over with hazard lamps on, stay inside if the area is dark, and call +91 93106 94349 or book Roadside Assistance. We will send help for a jump-start, puncture or tow. Share your live location so the mechanic can find you quickly.' },
    nearby: ['gorakhpur', 'chauri-chaura', 'gauri-bazar', 'pipraich'],
  },
  {
    slug: 'pipraich', name: 'Pipraich', hi: 'पिपराइच', district: 'gorakhpur', admin: 'Town & block, Gorakhpur district', tier: 2,
    intro: 'Pipraich is a sugar-mill town north-east of Gorakhpur, surrounded by cane fields and village roads. Farmers, traders and daily commuters here depend on motorcycles, pick-ups and family cars that work hard in all seasons. Bharat Mechanics offers doorstep vehicle service in Pipraich so you can get an oil change, brake work or battery replacement without taking time off work.',
    local: [
      'During the crushing season, the roads to the Pipraich mill fill with tractor-trolleys and bullock carts carrying cane. Braking suddenly behind an overloaded trolley is common, so brake pads and tyre tread should be checked before November.',
      'Cane mud and dust coat the underbody and chain of bikes. A chain clean-and-lube and an underbody wash after the season stop rust from eating into the frame and silencer.',
    ],
    faq: { q: 'Do you service tractors or only cars and bikes in Pipraich?', a: 'Our listed services are for cars and two-wheelers. For other vehicles, call us and we will tell you honestly whether a mechanic in our network can help.' },
    nearby: ['gorakhpur', 'chauri-chaura', 'kushmi-bazar', 'hata'],
  },
  {
    slug: 'sahjanwa', name: 'Sahjanwa', hi: 'सहजनवा', district: 'gorakhpur', admin: 'Town & tehsil, Gorakhpur district', tier: 2,
    intro: 'Sahjanwa is on NH-27 west of Gorakhpur, close to the GIDA industrial area, so it sees a steady flow of trucks, staff buses and factory commuters. For vehicle owners in Sahjanwa, Bharat Mechanics provides doorstep servicing and roadside help on the highway, with transparent prices and a 30-day service warranty.',
    local: [
      'Heavy vehicles on NH-27 kick up grit and leave oil on the road, and two-wheelers here share lanes with container trucks. Good tyres, working mirrors and sharp brakes are the basics every commuter should check monthly.',
      'Factory shift timings mean many people ride before sunrise and after dark. Headlamp alignment and a healthy battery are the two things most worth checking before winter.',
    ],
    faq: { q: 'Can you help if I break down on NH-27 near Sahjanwa?', a: 'Yes. Book Roadside Assistance or call +91 93106 94349. We arrange jump-starts, puncture repair, fuel delivery or towing on the highway around Sahjanwa and GIDA.' },
    nearby: ['gorakhpur', 'chauri-chaura', 'maharajganj'],
  },

  /* ═══════════════════════ DEORIA DISTRICT ═══════════════════════ */
  {
    slug: 'deoria', name: 'Deoria', hi: 'देवरिया', district: 'deoria', admin: 'District headquarters', tier: 1,
    intro: 'Deoria is the headquarters town of Deoria district, about 50 km east of Gorakhpur, and the hub for towns like Rudrapur, Salempur, Gauri Bazar and Tarkulwa. Most households here run a bike for daily errands and a car for family trips to Gorakhpur, Kushinagar or Bihar. Bharat Mechanics brings certified mechanics to your doorstep in Deoria for servicing, repairs, battery and tyre work, with upfront prices and payment after service.',
    local: [
      'Deoria town traffic is concentrated around the station, the main market and the roads towards Salempur and Kasia. Short, crowded trips keep the engine from fully warming up, which is hard on engine oil and batteries. City cars here should get an oil change on time and a battery health check at least once a year.',
      'The Deoria–Kasia and Gorakhpur–Deoria roads carry fast buses and trucks. Before any highway trip, check tyre pressure, brake response and all lamps — and keep the spare inflated. In the monsoon, avoid driving through flooded low patches near the rivers.',
    ],
    faq: { q: 'How fast can a mechanic reach me in Deoria?', a: 'Arrival time depends on your exact location and the time of day. The booking screen shows the available slot and estimated arrival for your address before you confirm, and you can track the mechanic live.' },
    nearby: ['rudrapur', 'gauri-bazar', 'salempur', 'baitalpur', 'hetimpur', 'tarkulwa'],
  },
  {
    slug: 'rudrapur', name: 'Rudrapur', hi: 'रुद्रपुर', district: 'deoria', admin: 'Tehsil & nagar panchayat, Deoria district', tier: 2,
    intro: 'Rudrapur is a tehsil town in Deoria district, known across Purvanchal for the ancient Dugdheshwar Nath temple. Devotees drive in from Gorakhpur, Deoria and nearby villages, especially during Sawan and Mahashivratri. Bharat Mechanics serves Rudrapur with doorstep car and bike service, repairs and roadside assistance so a breakdown never spoils a trip.',
    local: [
      'Festival days bring parking crowds and slow traffic around the temple area, which is when overheating, weak batteries and clutch trouble show up. A quick coolant and battery check before Sawan is cheap insurance.',
      'Rural link roads around Rudrapur have potholes and broken edges that knock wheels out of alignment. If your steering wheel is off-centre or your tyres wear unevenly, book wheel alignment and balancing.',
    ],
    faq: { q: 'Can I book a service in Rudrapur during Sawan or Mahashivratri?', a: 'Yes — but festival days fill up fast. Book a slot a day or two in advance, or call us for roadside help if something goes wrong on the day.' },
    nearby: ['deoria', 'gauri-bazar', 'chauri-chaura', 'baitalpur'],
  },
  {
    slug: 'gauri-bazar', name: 'Gauri Bazar', hi: 'गौरी बाजार', district: 'deoria', admin: 'Nagar panchayat & block, Deoria district', tier: 2,
    intro: 'Gauri Bazar is a nagar panchayat and block on the Gorakhpur–Deoria route, with its own railway station and a busy weekly market. It is a natural halfway point for people commuting between Gorakhpur and Deoria. Bharat Mechanics provides doorstep servicing and roadside help in Gauri Bazar so you do not have to ride to either city for a routine job.',
    local: [
      'Market days bring cycles, carts, bikes and pick-ups into the same narrow road. Slow-speed clutch riding in this traffic wears clutch plates and cables, so bikes here need clutch play adjusted regularly.',
      'The highway section outside town is fast. Worn tyres and weak brakes are the two things that turn a small slip into an accident — check tread depth before the monsoon every year.',
    ],
    faq: { q: 'Is doorstep service available in villages around Gauri Bazar?', a: 'Yes, we take bookings for Gauri Bazar and surrounding villages. Enter your village or landmark at booking; if a slot is not available for that address, our team will call you with the nearest option.' },
    nearby: ['deoria', 'rudrapur', 'chauri-chaura', 'kushmi-bazar'],
  },
  {
    slug: 'hetimpur', name: 'Hetimpur', hi: 'हेतिमपुर', district: 'deoria', admin: 'Nagar panchayat, Deoria district', tier: 2,
    intro: 'Hetimpur is a nagar panchayat in the north of Deoria district, close to the Kushinagar border, and a local market for the surrounding villages. People here often drive to Kasia, Padrauna or Deoria for work and shopping. Bharat Mechanics offers doorstep car and bike servicing in Hetimpur, plus emergency roadside help on the roads towards Kasia and Deoria.',
    local: [
      'The mix of village roads and fast district roads around Hetimpur is hard on suspension and tyres. Listen for knocking over bumps — worn suspension bushes are cheap to replace early and expensive to ignore.',
      'Farming families use bikes to carry heavy loads, which stretches chains and strains rear brakes. A chain adjustment and rear brake check every service keeps the bike safe when loaded.',
    ],
    faq: { q: 'Do you cover Hetimpur and the villages towards Kasia?', a: 'Yes. Hetimpur and nearby villages can book doorstep service. For locations further out, the booking screen shows availability for your exact address.' },
    nearby: ['deoria', 'kasia', 'tarkulwa', 'rampur-karkhana'],
  },
  {
    slug: 'mahuadih', name: 'Mahuadih', hi: 'महुआडीह', district: 'deoria', admin: 'Village, Baitalpur block, Deoria district', tier: 3,
    intro: 'Mahuadih is a village in the Baitalpur block of Deoria district. Like most villages in the area, its families rely on motorcycles for daily travel and on a car or pick-up for trips to Deoria and Gorakhpur. Getting a trusted mechanic to the village used to mean a long wait; with Bharat Mechanics you can book doorstep service or roadside help from your phone.',
    local: [
      'Village lanes around Mahuadih are narrow and often unpaved, so bikes take constant shocks. Loose spokes, worn fork oil and slack chains are common — ask the mechanic to check all three on every visit.',
      'Vehicles that stand for days between uses, such as a family car used only for weddings or hospital trips, often fail to start because of a flat battery. Starting the car once a week and a yearly battery test prevent most of these calls.',
    ],
    faq: { q: 'Will a mechanic really come to a village like Mahuadih?', a: 'We take village bookings across the Deoria area. Share your exact location or a landmark while booking; the app shows whether a slot is available, and our team calls you if the address needs coordination.' },
    nearby: ['baitalpur', 'deoria', 'gauri-bazar', 'rudrapur'],
  },
  {
    slug: 'tarkulwa', name: 'Tarkulwa', hi: 'तरकुलवा', district: 'deoria', admin: 'Nagar panchayat & block, Deoria district', tier: 2,
    intro: 'Tarkulwa is a nagar panchayat and development block in Deoria district, serving a large ring of farming villages. Two-wheelers are the lifeline here — for school runs, market trips and farm work. Bharat Mechanics brings verified mechanics to Tarkulwa for bike and car servicing, puncture and battery help, so you are not stuck waiting for a workshop in town.',
    local: [
      'Load-carrying on bikes is normal in Tarkulwa, whether it is milk cans, fodder or sacks of grain. Extra weight wears rear tyres, brake shoes and shock absorbers, so these parts deserve a check every service.',
      'In the rains, village roads turn slippery with clay. Tyres with good tread and properly adjusted brakes make a real difference — replace a bike tyre once the tread grooves are nearly flat.',
    ],
    faq: { q: 'Can I get a battery replaced at home in Tarkulwa?', a: 'Yes. Book Battery Replacement; the mechanic brings a genuine battery, fits it at your doorstep and offers buyback on the old one. The price is shown before you confirm.' },
    nearby: ['deoria', 'hetimpur', 'baitalpur', 'rampur-karkhana'],
  },
  {
    slug: 'padauli', name: 'Padauli', hi: 'पडौली', district: 'deoria', admin: 'Village, Deoria district (Bhaluani & Bhatni blocks)', tier: 3,
    intro: 'Padauli is a village name shared by settlements in the Bhaluani and Bhatni blocks of Deoria district. Families here travel to Bhatni, Deoria and Salempur for work, school and markets, mostly by motorcycle. Bharat Mechanics lets people in and around Padauli book a mechanic at home, get roadside help and buy genuine parts online.',
    local: [
      'Long rides on rough link roads to Bhatni and Salempur loosen bolts and wear chain sprockets. A quick tighten-and-lube during service prevents a snapped chain far from help.',
      'Bikes parked outdoors through the monsoon rust at the chain, brake drums and silencer. A rust check and fresh lubrication after the rains extend the life of these parts.',
    ],
    faq: { q: 'Which Padauli do you serve?', a: 'Both — Padauli villages in the Bhaluani and Bhatni blocks of Deoria district. Enter your full address or nearest landmark while booking so the right mechanic is assigned.' },
    nearby: ['bhatni', 'salempur', 'deoria', 'lar'],
  },
  {
    slug: 'salempur', name: 'Salempur', hi: 'सलेमपुर', district: 'deoria', admin: 'Tehsil & nagar panchayat, Deoria district', tier: 2,
    intro: 'Salempur is a tehsil town in Deoria district with its own railway junction, and a key stop on the routes towards Bihar. It has a large market and a steady flow of buses, cars and bikes from surrounding villages. Bharat Mechanics serves Salempur with doorstep vehicle servicing, repairs and roadside help at upfront prices.',
    local: [
      'Salempur traffic peaks around the station and market, with lots of short trips. Short trips mean the engine rarely reaches full temperature, which contaminates oil faster — change oil on time even if the odometer says you have kilometres left.',
      'Cars heading to Bihar or Gorakhpur from Salempur do long highway runs. Check tyres, coolant and brake pads before the trip, and keep the spare wheel inflated.',
    ],
    faq: { q: 'Do you have mechanics near Salempur railway station?', a: 'You can book doorstep service anywhere in Salempur, including the station and market area. The booking screen shows the slot and arrival estimate for your address.' },
    nearby: ['deoria', 'bhatpar-rani', 'lar', 'padauli', 'majhauli-raj'],
  },
  {
    slug: 'bhatpar-rani', name: 'Bhatpar Rani', hi: 'भाटपार रानी', district: 'deoria', admin: 'Tehsil & nagar panchayat, Deoria district', tier: 2,
    intro: 'Bhatpar Rani is a tehsil town on the eastern edge of Deoria district, right next to the Bihar border. Cross-border trade and family ties mean lots of driving towards Siwan and Gopalganj as well as Deoria and Gorakhpur. Bharat Mechanics offers doorstep car and bike service in Bhatpar Rani and roadside help on the border roads.',
    local: [
      'Border roads carry heavy trucks and see patchy maintenance, so tyres and suspension take a beating. Check tyre sidewalls for cuts and bulges — they are a common cause of sudden blowouts on these roads.',
      'Long interstate trips need a working spare, jack, first-aid kit and valid documents. A pre-trip inspection covering brakes, lights and fluids takes under an hour.',
    ],
    faq: { q: 'Can I get roadside help near the Bihar border from Bhatpar Rani?', a: 'Call +91 93106 94349 or book Roadside Assistance. We cover Bhatpar Rani and the roads around it; for locations across the border, our team will tell you what help is possible.' },
    nearby: ['salempur', 'deoria', 'lar', 'bhatni'],
  },
  {
    slug: 'barhaj', name: 'Barhaj', hi: 'बरहज', district: 'deoria', admin: 'Nagar palika (Gaura Barhaj), Deoria district', tier: 2,
    intro: 'Barhaj (Gaura Barhaj) is a nagar palika town on the Ghaghara river in Deoria district, historically a river trading post. Today it is a market town whose residents travel regularly to Deoria, Salempur and Mau. Bharat Mechanics serves Barhaj with doorstep servicing, repairs and roadside help, and genuine spare parts delivered through our online shop.',
    local: [
      'Being close to the Ghaghara means damp air and flood risk in the monsoon. Moisture is hard on electrical connectors and brake parts — ask for an electrical and brake inspection after the rains.',
      'River-bank and ghat roads can be sandy and uneven, which is tough on tyres and suspension. Correct tyre pressure makes the ride safer and reduces uneven wear.',
    ],
    faq: { q: 'My bike was in flood water in Barhaj. Is it safe to start?', a: 'Do not start it. Water in the engine or silencer can cause serious damage. Book a mechanic to drain, dry and inspect the bike first — engine oil, air filter, spark plug and wiring all need checking.' },
    nearby: ['salempur', 'deoria', 'majhauli-raj', 'lar'],
  },
  {
    slug: 'bhatni', name: 'Bhatni', hi: 'भटनी', district: 'deoria', admin: 'Nagar panchayat (Bhatni Bazar), Deoria district', tier: 2,
    intro: 'Bhatni is best known for Bhatni Junction, one of the important railway junctions of eastern Uttar Pradesh, and for its old sugar mill. The town is a travel hub, so people are always driving in to catch trains or pick up family. Bharat Mechanics provides doorstep car and bike servicing and roadside help across Bhatni and nearby villages.',
    local: [
      'Station traffic means a lot of idling and short trips, which drains batteries and wears starter motors. If your vehicle cranks slowly on cold mornings, get the battery tested before it fails completely.',
      'Village roads around Bhatni are narrow and busy with tractors in the cane season. Keep brakes responsive and use the horn and headlamps carefully at blind turns.',
    ],
    faq: { q: 'Can a mechanic meet me at Bhatni station parking?', a: 'Yes, you can book a mechanic to any address or landmark in Bhatni, including the station area. Share an exact pin on the map so the mechanic can find your vehicle.' },
    nearby: ['padauli', 'salempur', 'lar', 'deoria'],
  },
  {
    slug: 'lar', name: 'Lar', hi: 'लार', district: 'deoria', admin: 'Nagar panchayat, Deoria district', tier: 2,
    intro: 'Lar is a nagar panchayat in the south-east of Deoria district, served by Lar Road railway station and surrounded by farming villages. Motorcycles and small cars are the everyday vehicles here. Bharat Mechanics makes it easy for Lar residents to book a mechanic at home, get a battery or tyre changed and order genuine parts online.',
    local: [
      'Farm roads around Lar are dusty for most of the year, and dust is the enemy of air filters and brake linings. An air-filter clean every service visit keeps mileage and pickup where they should be.',
      'Many bikes here are used for years without a proper service. If yours has not had fresh oil, a new spark plug and a brake overhaul in over a year, a full service will noticeably improve starting and mileage.',
    ],
    faq: { q: 'What does a full bike service include?', a: 'Oil change, air-filter clean, spark-plug check, chain clean and adjustment, brake adjustment, battery and electrical check, and a test ride. Anything extra is quoted first — nothing is replaced without your approval.' },
    nearby: ['salempur', 'bhatpar-rani', 'bhatni', 'padauli'],
  },
  {
    slug: 'rampur-karkhana', name: 'Rampur Karkhana', hi: 'रामपुर कारखाना', district: 'deoria', admin: 'Nagar panchayat & block, Deoria district', tier: 2,
    intro: 'Rampur Karkhana is a nagar panchayat and block in Deoria district, surrounded by cane fields and village markets. Bikes, pick-ups and family cars all work hard here, especially through the harvest months. Bharat Mechanics gives Rampur Karkhana doorstep servicing, repairs and roadside help with prices you see upfront.',
    local: [
      'Harvest and cane-season traffic brings mud onto the roads and slows everything down. Keep your bike’s brakes adjusted and your tyres in good shape — a skid on a muddy patch is the most common winter accident here.',
      'Pick-ups and cars used for carrying produce should get suspension and tyre checks more often than family cars, because the extra load wears them faster.',
    ],
    faq: { q: 'Is there a visit charge for doorstep service in Rampur Karkhana?', a: 'All charges are shown on the booking screen before you confirm, and you pay only after the service is done. There are no hidden charges added later.' },
    nearby: ['deoria', 'hetimpur', 'tarkulwa', 'kasia'],
  },
  {
    slug: 'baitalpur', name: 'Baitalpur', hi: 'बैतालपुर', district: 'deoria', admin: 'Nagar panchayat & block, Deoria district', tier: 2,
    intro: 'Baitalpur is a nagar panchayat and development block in Deoria district, between Deoria and Gorakhpur, with villages like Mahuadih in its area. Daily commuting to Deoria and Gorakhpur keeps bikes and cars busy. Bharat Mechanics provides doorstep vehicle care in Baitalpur so you can service your vehicle without losing a working day.',
    local: [
      'Commuters from Baitalpur mix village roads with the fast Gorakhpur–Deoria stretch. That combination wears tyres unevenly — rotating tyres and checking alignment every 10,000 km keeps wear even.',
      'Bikes that do daily 30–50 km commutes need an oil change roughly every 2,500–3,000 km. Old oil is the main reason engines here start sounding rough.',
    ],
    faq: { q: 'Do you cover Mahuadih and other villages in Baitalpur block?', a: 'Yes. Villages across Baitalpur block, including Mahuadih, can book doorstep service. Enter your address or landmark and the booking screen will show availability.' },
    nearby: ['mahuadih', 'deoria', 'gauri-bazar', 'rudrapur'],
  },
  {
    slug: 'majhauli-raj', name: 'Majhauli Raj', hi: 'मझौली राज', district: 'deoria', admin: 'Nagar panchayat, Deoria district', tier: 3,
    intro: 'Majhauli Raj is a historic nagar panchayat in Deoria district, once the seat of the Majhauli estate, close to Salempur. It is a small, busy town where two-wheelers do most of the work. Bharat Mechanics serves Majhauli Raj with doorstep servicing, puncture and battery help, and genuine parts delivered to your home.',
    local: [
      'Short hops between Majhauli, Salempur and nearby villages are hard on batteries and spark plugs. If your bike needs several kicks or a long crank to start, a plug and battery check usually fixes it.',
      'Narrow old-town lanes mean lots of first-gear riding. Keep the clutch cable lubricated and correctly adjusted to avoid clutch slip.',
    ],
    faq: { q: 'Can I order spare parts online and get them fitted in Majhauli Raj?', a: 'Yes. Order genuine parts from our shop and add a doorstep service booking — the mechanic fits the part at your home and you pay for the labour after the job.' },
    nearby: ['salempur', 'barhaj', 'lar', 'deoria'],
  },

  /* ═══════════════════════ KUSHINAGAR DISTRICT ═══════════════════════ */
  {
    slug: 'kushinagar', name: 'Kushinagar', hi: 'कुशीनगर', district: 'kushinagar', admin: 'Buddhist pilgrimage town & tehsil (Kushinagar/Kasia)', tier: 1,
    intro: 'Kushinagar is where the Buddha attained Mahaparinirvana, and the Mahaparinirvana Temple and Ramabhar Stupa draw pilgrims from across Asia. Since Kushinagar International Airport opened in 2021, the town sees even more taxis, tourist buses and private cars on NH-27. Bharat Mechanics provides doorstep car and bike servicing, repairs and roadside help in Kushinagar, for residents, taxi operators and visitors alike.',
    local: [
      'Taxi and tour operators in Kushinagar pile up kilometres fast during the pilgrim season from October to February. Scheduling an oil change, brake inspection and AC service just before the season avoids breakdowns in the middle of a booking.',
      'NH-27 through Kushinagar and Kasia is fast and busy, with fog in winter. Clean headlamps, working hazard lamps and good wiper blades are essential for early-morning airport and temple runs.',
    ],
    faq: { q: 'I am visiting Kushinagar and my car has a problem. Can you help?', a: 'Yes. Book Roadside Assistance or call +91 93106 94349 and share your location near the temple, airport or hotel. We arrange jump-starts, puncture repair, fuel delivery or towing.' },
    nearby: ['kasia', 'padrauna', 'hata', 'fazilnagar', 'hetimpur'],
    areas: ['Mahaparinirvana Temple area', 'Ramabhar Stupa road', 'Kushinagar Airport road', 'Kasia bus stand', 'NH-27 corridor'],
  },
  {
    slug: 'padrauna', name: 'Padrauna', hi: 'पडरौना', district: 'kushinagar', admin: 'District headquarters of Kushinagar', tier: 1,
    intro: 'Padrauna is the district headquarters of Kushinagar, with the collectorate, courts, hospitals and a busy railway station. People from Ramkola, Kaptanganj, Sukrauli and dozens of villages come here for work and shopping. Bharat Mechanics serves Padrauna with doorstep car and bike service, repairs, battery and tyre work, and roadside assistance at upfront prices.',
    local: [
      'Padrauna’s market and station roads are crowded through the day, with e-rickshaws and bikes weaving through. City riding like this wears brake pads and clutch plates quickly, so check them every service rather than waiting for noise.',
      'The Padrauna–Kasia road and village links towards Sukrauli and Ramkola get busy with cane trolleys in winter. Headlamp alignment and brake health matter most for evening rides home.',
    ],
    faq: { q: 'Do you provide mechanics across Padrauna town?', a: 'Yes. Book doorstep service anywhere in Padrauna — market, station area, court and collectorate area, and nearby villages. The booking screen shows the slot and arrival time for your address.' },
    nearby: ['kasia', 'kushinagar', 'sukrauli', 'ramkola', 'kaptanganj', 'barwa'],
  },
  {
    slug: 'kasia', name: 'Kasia', hi: 'कसया', district: 'kushinagar', admin: 'Town & tehsil (Kushinagar/Kasia)', tier: 1,
    intro: 'Kasia is the twin town of Kushinagar on NH-27 and the junction for roads to Deoria and Padrauna. Its bus stand and market make it one of the busiest places in the district. Bharat Mechanics provides doorstep vehicle service in Kasia and fast roadside help on the highway and the Deoria and Padrauna roads.',
    local: [
      'Kasia is a crossing point for highway traffic and local traffic, so riders deal with buses pulling out, trucks and e-rickshaws all at once. Good brakes and working indicators are the basics that keep you safe here.',
      'Many Kasia families drive to Gorakhpur and Deoria regularly. A pre-trip check of tyre pressure, coolant and brakes takes minutes and prevents the most common highway breakdowns.',
    ],
    faq: { q: 'Can I book a car AC service in Kasia before summer?', a: 'Yes. AC Service & Gas Refill includes inspection, gas top-up, cooling-coil cleaning and odour removal. Booking it in March or April avoids the May rush.' },
    nearby: ['kushinagar', 'padrauna', 'hata', 'hetimpur', 'fazilnagar'],
  },
  {
    slug: 'hata', name: 'Hata', hi: 'हाटा', district: 'kushinagar', admin: 'Tehsil & block, Kushinagar district', tier: 2,
    intro: 'Hata is a tehsil town on the Gorakhpur–Kushinagar highway, the first big stop in Kushinagar district when you drive in from Gorakhpur. Its market serves a large rural area. Bharat Mechanics offers doorstep servicing, repairs and roadside help in Hata for bikes and cars.',
    local: [
      'Highway traffic through Hata is fast, and the market stretch is congested. Riders switching between the two need brakes and tyres in good condition — and should never ride on bald tyres in the monsoon.',
      'Farm roads branching off from Hata are rough. If your bike’s front end rattles or the brakes feel spongy, ask for a fork and brake inspection at your next service.',
    ],
    faq: { q: 'Is roadside assistance available on the highway near Hata?', a: 'Yes. Book Roadside Assistance or call +91 93106 94349 for jump-starts, flat tyres, fuel delivery or towing on the Gorakhpur–Kushinagar highway near Hata.' },
    nearby: ['kasia', 'kushinagar', 'gorakhpur', 'pipraich', 'motichak'],
  },
  {
    slug: 'kaptanganj', name: 'Kaptanganj', hi: 'कप्तानगंज', district: 'kushinagar', admin: 'Tehsil & nagar panchayat, Kushinagar district', tier: 2,
    intro: 'Kaptanganj is a tehsil town and railway junction in Kushinagar district, on the rail line between Gorakhpur and Narkatiaganj and at the heart of the district’s sugarcane belt. Traders, farmers and commuters here depend on their vehicles daily. Bharat Mechanics serves Kaptanganj with doorstep car and bike servicing, repairs, battery and tyre work and roadside help.',
    local: [
      'In the crushing season, roads around Kaptanganj fill with cane trolleys, and spilled cane and mud make surfaces slippery. Healthy tyres and well-adjusted brakes are the difference between a scare and a fall.',
      'Commuters towards Ramkola, Padrauna and Gorakhpur mix rough roads and fast stretches. Rotating tyres and checking alignment every 10,000 km keeps wear even and handling safe.',
    ],
    faq: { q: 'Do you cover villages around Kaptanganj and Mathauli?', a: 'Yes. Kaptanganj town, Mathauli and nearby villages can book doorstep service. Enter your address or landmark and the booking screen shows availability.' },
    nearby: ['ramkola', 'mathauli', 'padrauna', 'nebua-naurangia', 'ghughli'],
  },
  {
    slug: 'ramkola', name: 'Ramkola', hi: 'रामकोला', district: 'kushinagar', admin: 'Nagar panchayat & block, Kushinagar district', tier: 2,
    intro: 'Ramkola is a sugar-mill town and nagar panchayat in Kushinagar district, with its own railway station and a large farming hinterland. From November to April, cane traffic defines life on its roads. Bharat Mechanics provides doorstep vehicle servicing and roadside help in Ramkola so vehicles keep running through the busiest months.',
    local: [
      'Mill-bound tractor-trolleys are slow, overloaded and often poorly lit at night. Riders should keep headlamps aligned and bright, and brakes sharp, for evening rides around Ramkola.',
      'Cane mud clogs chains, brake drums and wheel arches. A chain clean-and-lube and a brake-drum clean after the season prevent rust and noisy brakes.',
    ],
    faq: { q: 'What is the best time to service my vehicle in Ramkola?', a: 'Just before the crushing season, in October, is ideal: brakes, tyres, lights and chain checked before the roads get muddy. A second check after the season clears the mud and rust.' },
    nearby: ['kaptanganj', 'padrauna', 'sukrauli', 'mathauli'],
  },
  {
    slug: 'sukrauli', name: 'Sukrauli', hi: 'सुकरौली', district: 'kushinagar', admin: 'Nagar panchayat & block, Kushinagar district', tier: 2,
    intro: 'Sukrauli is a nagar panchayat and development block in Kushinagar district, between Padrauna and the Gorakhpur border, with villages like Barwa in its area. Bikes are the everyday transport for most families. Bharat Mechanics lets you book a mechanic at home in Sukrauli, get roadside help and order genuine parts online.',
    local: [
      'Rural roads around Sukrauli are narrow and patchy, and bikes often carry two or three people or farm loads. Tyres, rear shock absorbers and brakes wear faster under that load — check them at every service.',
      'Monsoon rain turns kacha roads to mud. A bike with worn tyres or poorly adjusted brakes is dangerous in these conditions — replace tyres before the rains, not after a fall.',
    ],
    faq: { q: 'Do you serve Barwa and other villages in Sukrauli block?', a: 'Yes. Barwa and other villages in Sukrauli block can book doorstep service. Enter your village and a landmark while booking.' },
    nearby: ['barwa', 'padrauna', 'ramkola', 'hata'],
  },
  {
    slug: 'barwa', name: 'Barwa', hi: 'बरवा', district: 'kushinagar', admin: 'Village, Sukrauli block (Padrauna tehsil), Kushinagar district', tier: 3,
    intro: 'Barwa is a village in the Sukrauli block of Kushinagar district, in Padrauna tehsil, with Padrauna, Hata and Gorakhpur as its nearest big towns. Most families here depend on motorcycles for work, school and hospital trips. With Bharat Mechanics, people in Barwa can book a verified mechanic to their doorstep instead of losing a day travelling to a town workshop.',
    local: [
      'Village roads around Barwa are hard on suspension and tyres, and a puncture far from a repair shop can end a trip. Keeping tyres properly inflated and replacing worn ones early is the best protection.',
      'Bikes here often go long stretches between services. An overdue oil change is the main cause of rough engines and poor mileage — service every 2,500–3,000 km or at least every four months.',
    ],
    faq: { q: 'How do I book a mechanic in Barwa?', a: 'Book on the Bharat Mechanics website or app, or call +91 93106 94349. Enter Barwa, Sukrauli block, and a nearby landmark; the booking screen shows the slot, and our team calls to coordinate if needed.' },
    nearby: ['sukrauli', 'padrauna', 'hata', 'motichak'],
  },
  {
    slug: 'mathauli', name: 'Mathauli', hi: 'मठौली', district: 'kushinagar', admin: 'Nagar panchayat, Kushinagar district', tier: 3,
    intro: 'Mathauli is one of the ten nagar panchayats of Kushinagar district, a local market town for the surrounding villages. Residents regularly travel to Kaptanganj, Ramkola and Padrauna. Bharat Mechanics offers doorstep servicing, battery and tyre help, and roadside assistance for Mathauli and its villages.',
    local: [
      'Local roads link Mathauli to bigger towns through farm country, where cane and harvest traffic slow things down. Brakes and tyres are the parts to check before the season starts.',
      'Two-wheelers used for short, frequent trips in Mathauli need their battery and spark plug checked every service — they are the usual reasons a bike will not start in winter.',
    ],
    faq: { q: 'Can I get a puncture fixed at home in Mathauli?', a: 'Yes. Book Roadside Assistance for a puncture repair at your location, or call us. For tubeless tyres, the mechanic plugs the puncture on the spot where possible.' },
    nearby: ['kaptanganj', 'ramkola', 'padrauna', 'gadrampur'],
  },
  {
    slug: 'gadrampur', name: 'Gadrampur', hi: 'गदरामपुर', district: 'kushinagar', admin: 'Village in the Kushinagar–Deoria area', tier: 3,
    intro: 'Gadrampur is a village in the Kushinagar–Deoria area where, like most of the surrounding countryside, motorcycles and small cars carry families to markets, schools and hospitals. Finding a reliable mechanic nearby is not always easy. Bharat Mechanics lets people in Gadrampur book doorstep vehicle service, roadside help and genuine parts from a phone.',
    local: [
      'Rural roads mean constant shocks to the suspension, wheels and chain. A mechanic visit every few months to tighten, lubricate and adjust these parts keeps the vehicle safe and reliable.',
      'Vehicles used only occasionally often have weak batteries. Start your vehicle at least once a week and get the battery tested before winter.',
    ],
    faq: { q: 'Will you come to Gadrampur for a service?', a: 'Enter your full address and a landmark while booking. The booking screen shows whether a slot is available for your location, and our team calls you to confirm the visit.' },
    nearby: ['mathauli', 'kaptanganj', 'padrauna', 'kasia'],
  },
  {
    slug: 'tamkuhi-raj', name: 'Tamkuhi Raj', hi: 'तमकुही राज', district: 'kushinagar', admin: 'Tehsil, Kushinagar district', tier: 2,
    intro: 'Tamkuhi Raj is a tehsil in the east of Kushinagar district on NH-27, the last big stretch before the highway crosses into Bihar towards Gopalganj. It sees heavy interstate truck and bus traffic. Bharat Mechanics serves Tamkuhi Raj with doorstep servicing and roadside help on the highway.',
    local: [
      'Interstate trucks and buses make the NH-27 stretch near Tamkuhi fast and intimidating for two-wheelers. Working mirrors, indicators and a loud horn are safety equipment here, not extras.',
      'Long interstate drives from Tamkuhi need a proper pre-trip check: tyres including the spare, brakes, coolant, lights and battery. A 45-minute inspection prevents most highway breakdowns.',
    ],
    faq: { q: 'Can you help with a breakdown on NH-27 near Tamkuhi Raj?', a: 'Yes. Call +91 93106 94349 or book Roadside Assistance for jump-starts, puncture repair, fuel delivery or towing. Share your live location so help reaches you fast.' },
    nearby: ['seorahi', 'fazilnagar', 'dudahi', 'kasia'],
  },
  {
    slug: 'khadda', name: 'Khadda', hi: 'खड्डा', district: 'kushinagar', admin: 'Tehsil & nagar panchayat, Kushinagar district', tier: 2,
    intro: 'Khadda is a tehsil town in the north of Kushinagar district, on the Gandak side near the Bihar border, with a sugar mill and a large farming area. The Gandak floods shape life here every monsoon. Bharat Mechanics offers doorstep vehicle service and roadside help in Khadda and its villages.',
    local: [
      'Flood season near the Gandak can leave roads under water. Never drive through water deeper than the middle of your wheels, and never restart an engine that has stalled in water — have it inspected first.',
      'Cane-season traffic to the mill brings mud and slow trolleys onto the roads. Good tyres, sharp brakes and bright headlamps are the essentials for the winter months.',
    ],
    faq: { q: 'My car stalled in flood water near Khadda. What now?', a: 'Do not restart it. Call +91 93106 94349 or book Roadside Assistance for a tow. The engine, air intake, oil and electricals must be checked before starting, otherwise the engine can be badly damaged.' },
    nearby: ['chhitauni', 'nebua-naurangia', 'padrauna', 'kaptanganj'],
  },
  {
    slug: 'fazilnagar', name: 'Fazilnagar', hi: 'फाजिलनगर', district: 'kushinagar', admin: 'Nagar panchayat & block, Kushinagar district', tier: 2,
    intro: 'Fazilnagar is a nagar panchayat and block on NH-27 in Kushinagar district, associated with ancient Pava, where the Buddha is said to have had his last meal. It is a busy highway town between Kasia and Tamkuhi. Bharat Mechanics serves Fazilnagar with doorstep servicing, repairs and highway roadside help.',
    local: [
      'Highway traffic through Fazilnagar is fast, and local riders join it from side roads. Bright headlamps and working indicators help other drivers see you — especially at dawn and dusk.',
      'Villages around Fazilnagar depend on bikes for everything from farm work to hospital trips. Regular oil changes and chain care keep these bikes reliable for years.',
    ],
    faq: { q: 'Do you cover villages around Fazilnagar?', a: 'Yes. Fazilnagar town and surrounding villages can book doorstep service. Enter your address or landmark while booking to see availability.' },
    nearby: ['kasia', 'tamkuhi-raj', 'kushinagar', 'dudahi'],
  },
  {
    slug: 'dudahi', name: 'Dudahi', hi: 'दुदही', district: 'kushinagar', admin: 'Nagar panchayat & block, Kushinagar district', tier: 3,
    intro: 'Dudahi is a nagar panchayat and development block in Kushinagar district with its own railway station, serving villages in the east of the district. Motorcycles do most of the daily work here. Bharat Mechanics gives Dudahi residents doorstep bike and car service and roadside help.',
    local: [
      'Rural roads and cane-season traffic around Dudahi are hard on tyres and brakes. A tyre and brake check before November is the most useful single service of the year.',
      'Dust and mud shorten the life of air filters and chains. Ask for an air-filter clean and chain lube on every visit.',
    ],
    faq: { q: 'Can I book a mechanic from Dudahi by phone?', a: 'Yes. Call +91 93106 94349 and our team will book the service for you, or book online in a couple of minutes.' },
    nearby: ['tamkuhi-raj', 'seorahi', 'fazilnagar', 'padrauna'],
  },
  {
    slug: 'seorahi', name: 'Seorahi', hi: 'सेवरही', district: 'kushinagar', admin: 'Nagar panchayat & block (Tamkuhi Road), Kushinagar district', tier: 3,
    intro: 'Seorahi (Sewarhi) is a nagar panchayat and block in the east of Kushinagar district, home to Tamkuhi Road railway station and close to the Bihar border. It is a busy local market for many villages. Bharat Mechanics serves Seorahi with doorstep servicing and roadside assistance.',
    local: [
      'Close to the border, Seorahi sees a mix of local and interstate traffic. Keeping lights, horn and brakes in good order matters on these busy roads.',
      'Families here often travel long distances for weddings and festivals. A pre-trip check of tyres, brakes and battery prevents most breakdowns on the way.',
    ],
    faq: { q: 'Is Seorahi the same as Tamkuhi Road?', a: 'Tamkuhi Road is the railway station at Seorahi. Whichever name you use, you can book doorstep service by entering your address or landmark.' },
    nearby: ['tamkuhi-raj', 'dudahi', 'fazilnagar'],
  },
  {
    slug: 'chhitauni', name: 'Chhitauni', hi: 'छितौनी', district: 'kushinagar', admin: 'Nagar panchayat, Kushinagar district', tier: 3,
    intro: 'Chhitauni is a nagar panchayat on the Gandak in the north of Kushinagar district, linked to Bagaha in Bihar across the river. Floods and river-side roads shape driving here. Bharat Mechanics gives Chhitauni doorstep vehicle service and roadside help.',
    local: [
      'Sandy, uneven river-side roads and seasonal flooding are hard on tyres, suspension and brakes. After every monsoon, get the brakes and electricals inspected.',
      'Moisture from the river causes rust on chains and brake parts. Regular lubrication and a rust check keep bikes safe and quiet.',
    ],
    faq: { q: 'Do you serve Chhitauni during the flood season?', a: 'We take bookings whenever roads are safe to reach. During floods, call +91 93106 94349 and our team will tell you what help is possible for your location.' },
    nearby: ['khadda', 'nebua-naurangia', 'padrauna'],
  },
  {
    slug: 'motichak', name: 'Motichak', hi: 'मोतीचक', district: 'kushinagar', admin: 'Development block, Kushinagar district', tier: 3,
    intro: 'Motichak is one of the fourteen development blocks of Kushinagar district, a rural area where families rely on motorcycles and small cars for daily travel to Hata, Kasia and Padrauna. Bharat Mechanics lets people in Motichak book a mechanic at home, get roadside help and buy genuine parts online.',
    local: [
      'Village roads in Motichak are narrow and uneven, so wheels, spokes and suspension take a beating. A regular tighten-and-check prevents loose parts and wobbly wheels.',
      'Bikes used for farm work carry heavy loads. Rear tyres, brake shoes and chains wear faster and should be checked every service.',
    ],
    faq: { q: 'Can I get a mechanic in a village in Motichak block?', a: 'Yes. Enter your village and a landmark at booking. The booking screen shows whether a slot is available, and our team calls you if coordination is needed.' },
    nearby: ['hata', 'kasia', 'sukrauli', 'barwa'],
  },
  {
    slug: 'nebua-naurangia', name: 'Nebua Naurangia', hi: 'नेबुआ नौरंगिया', district: 'kushinagar', admin: 'Development block, Kushinagar district', tier: 3,
    intro: 'Nebua Naurangia is a development block in the north of Kushinagar district, between Kaptanganj, Padrauna and the Gandak belt. Farming villages here depend on bikes, tractors and pick-ups. Bharat Mechanics brings doorstep bike and car service and roadside help to Nebua Naurangia.',
    local: [
      'Farm and cane traffic dominate the roads for half the year. Mud, slow trolleys and poor night lighting mean brakes, tyres and headlamps need attention before winter.',
      'Monsoon flooding in the Gandak belt can soak vehicles. After any water exposure, get the engine oil, air filter and wiring checked before riding again.',
    ],
    faq: { q: 'How do I book a service in Nebua Naurangia?', a: 'Book online or call +91 93106 94349. Enter your village and a landmark so the right mechanic is assigned.' },
    nearby: ['kaptanganj', 'khadda', 'padrauna', 'chhitauni'],
  },
  {
    slug: 'bishunpura', name: 'Bishunpura', hi: 'बिशुनपुरा', district: 'kushinagar', admin: 'Development block (Vishunpura), Kushinagar district', tier: 3,
    intro: 'Bishunpura (Vishunpura) is a development block of Kushinagar district made up of farming villages, with Padrauna and Kasia as the nearest big towns. Two-wheelers are the main transport here. Bharat Mechanics lets Bishunpura residents book doorstep vehicle service and roadside help from a phone.',
    local: [
      'Village roads and farm use wear chains, sprockets and tyres quickly. A chain and tyre check every service keeps the bike safe and saves money in the long run.',
      'In winter fog, a bike with dim or misaligned headlamps is hard to see. Ask the mechanic to check and align the headlamp before December.',
    ],
    faq: { q: 'Do you serve villages in Bishunpura block?', a: 'Yes. Enter your village and a nearby landmark while booking to see availability, or call us to book.' },
    nearby: ['padrauna', 'kasia', 'sukrauli'],
  },

  /* ═══════════════════════ MAHARAJGANJ DISTRICT ═══════════════════════ */
  {
    slug: 'maharajganj', name: 'Maharajganj', hi: 'महराजगंज', district: 'maharajganj', admin: 'District headquarters', tier: 1,
    intro: 'Maharajganj is the headquarters of Maharajganj district, north of Gorakhpur and close to the Nepal border at Sonauli. It serves a large farming and forest region, and its people drive regularly to Gorakhpur for work, hospitals and shopping. Bharat Mechanics provides doorstep car and bike servicing, repairs and roadside help in Maharajganj.',
    local: [
      'The Gorakhpur–Maharajganj road is a daily commute for many, mixing fast cars with slow farm vehicles. Keep tyres, brakes and lights in top shape, especially for early-morning and late-evening runs.',
      'Forest stretches and Terai rain mean fog in winter and slippery roads in the monsoon. Good wiper blades, clean headlamps and correct tyre pressure make these drives much safer.',
    ],
    faq: { q: 'Can I get my car serviced at home in Maharajganj?', a: 'Yes. Book doorstep service online or call +91 93106 94349. The booking screen shows the price, slot and arrival estimate for your address, and you pay after the service.' },
    nearby: ['ghughli', 'siswa-bazar', 'nautanwa', 'gorakhpur'],
  },
  {
    slug: 'ghughli', name: 'Ghughli', hi: 'घुघली', district: 'maharajganj', admin: 'Town & block, Maharajganj district', tier: 2,
    intro: 'Ghughli is a town and development block in Maharajganj district, on the rail line from Gorakhpur towards Siswa and Narkatiaganj, close to the Kushinagar border near Kaptanganj. It is a market for many villages. Bharat Mechanics serves Ghughli with doorstep vehicle service, battery and tyre help, and roadside assistance.',
    local: [
      'Roads around Ghughli carry cane traffic in the crushing season and get muddy in the rains. Tyres with good tread and properly adjusted brakes are the most important safety items.',
      'Commuters to Gorakhpur and Maharajganj from Ghughli put on a lot of kilometres. An oil change on schedule and a yearly brake overhaul keep a daily bike healthy.',
    ],
    faq: { q: 'Do you cover Ghughli and the villages towards Kaptanganj?', a: 'Yes. Ghughli and nearby villages, including those towards Kaptanganj, can book doorstep service. Enter your address at booking to see availability.' },
    nearby: ['maharajganj', 'siswa-bazar', 'kaptanganj', 'gorakhpur'],
  },
  {
    slug: 'siswa-bazar', name: 'Siswa Bazar', hi: 'सिसवा बाजार', district: 'maharajganj', admin: 'Town, Maharajganj district', tier: 2,
    intro: 'Siswa Bazar is a sugar-mill town in Maharajganj district with a railway station on the Gorakhpur–Narkatiaganj line and a busy market. Cane season and market traffic keep its roads full. Bharat Mechanics offers doorstep car and bike servicing and roadside help in Siswa Bazar.',
    local: [
      'Mill traffic from November to April means slow, heavy trolleys and mud on the roads. Check brakes, tyres and headlamps before the season.',
      'Market-day riding at low speed wears clutches and brakes. Regular adjustment keeps them working smoothly.',
    ],
    faq: { q: 'Can I get genuine spare parts delivered in Siswa Bazar?', a: 'Yes. Order genuine parts from our online shop and add a doorstep service booking if you want a mechanic to fit them.' },
    nearby: ['ghughli', 'maharajganj', 'kaptanganj'],
  },
  {
    slug: 'nautanwa', name: 'Nautanwa', hi: 'नौतनवा', district: 'maharajganj', admin: 'Town, Maharajganj district (near Sonauli border)', tier: 2,
    intro: 'Nautanwa is a border town in Maharajganj district near Sonauli, the main road crossing into Nepal and the route to Lumbini and Bhairahawa. Travellers, traders and tour vehicles pass through every day. Bharat Mechanics serves Nautanwa with doorstep servicing and roadside help for residents and travellers.',
    local: [
      'Cross-border trips mean long drives and waiting at the crossing. A pre-trip check of tyres, brakes, coolant, battery and lights avoids trouble on the road to Nepal.',
      'Terai monsoon rain is heavy and sudden near the border. Replace worn wiper blades and check tyre tread before the rains.',
    ],
    faq: { q: 'Can you help if my car breaks down near the Sonauli border?', a: 'On the Indian side, yes — call +91 93106 94349 or book Roadside Assistance and share your location. For locations inside Nepal, our team will tell you what help is possible.' },
    nearby: ['maharajganj', 'siswa-bazar', 'ghughli'],
  },
]

export const CITY_BY_SLUG: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.slug, c]))

/** The URL slug of a city guide. */
export const cityPostSlug = (citySlug: string) => `mechanic-in-${citySlug}`
