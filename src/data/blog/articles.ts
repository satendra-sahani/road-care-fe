import type { Post } from './types'

// Topical, seasonal guides for Purvanchal (Gorakhpur, Deoria, Kushinagar,
// Maharajganj). They link into the city guides and the booking flow.

const PUB = '2026-09-26'

export const ARTICLES: Post[] = [
  {
    slug: 'diwali-chhath-road-trip-car-bike-checklist',
    kind: 'guide',
    category: 'Festive travel',
    title: 'Diwali & Chhath 2026 Road Trip: 15-Point Car and Bike Checklist for Purvanchal',
    metaTitle: 'Diwali & Chhath 2026 Car & Bike Checklist',
    description: 'Driving home for Diwali or Chhath 2026 in Gorakhpur, Deoria or Kushinagar? Use this 15-point car and bike checklist to avoid breakdowns on the way.',
    excerpt: 'Tyres, brakes, battery, lights and paperwork — the 15 checks that prevent almost every festive-season breakdown on Purvanchal roads.',
    keywords: 'Diwali road trip checklist, Chhath Puja travel car check, car service before Diwali Gorakhpur, bike service before Chhath, festive car checkup Deoria Kushinagar',
    datePublished: PUB,
    dateModified: PUB,
    readMins: 6,
    heroImg: '/design/sv-car.webp',
    heroAlt: 'Family car ready for a festive road trip',
    intro: 'Diwali and Chhath fall in November this year, and they bring the heaviest traffic of the year to Gorakhpur, Deoria, Kushinagar and the Bihar border. Families drive home from Delhi, Lucknow and Kolkata, relatives visit from nearby villages and ghats fill up at dawn. Most festive breakdowns are avoidable: a flat battery, a worn tyre, a coolant leak or a blown bulb. This checklist covers what to check at least a week before you travel.',
    sections: [
      {
        id: 'car-checklist',
        h2: 'Car checklist: 10 checks before you leave',
        blocks: [
          { ol: [
            '**Tyres, including the spare.** Check pressure when the tyres are cold, and look for cuts or bulges on the sidewalls. Tread should be deeper than the wear indicator bars.',
            '**Brakes.** Squealing, grinding or a soft pedal means the pads or fluid need attention. A [brake service](/services) costs far less than an accident.',
            '**Battery.** If the engine cranks slowly in the morning, get the battery tested. Batteries older than three years often fail on the first cold mornings of November.',
            '**Engine oil and filter.** If the oil is due within the next 1,000 km, change it before the trip rather than after.',
            '**Coolant.** Top up to the mark with the correct coolant and check under the car for leaks after it has been parked overnight.',
            '**Lights.** Headlamps (high and low beam), brake lights, indicators, hazard lamps and fog lamps. Pre-dawn Chhath ghat trips depend on them.',
            '**Wipers and washer fluid.** Replace streaky wiper blades; morning dew and fog demand a clear windscreen.',
            '**AC and cabin filter.** A clogged cabin filter makes the AC weak and the cabin dusty on long drives.',
            '**Emergency kit.** Jack, wheel spanner, warning triangle, torch, first-aid kit and a phone charger.',
            '**Documents.** RC, insurance, PUC and driving licence (DigiLocker copies are accepted), plus a working FASTag with enough balance for tolls.',
          ] },
        ],
      },
      {
        id: 'bike-checklist',
        h2: 'Bike checklist: 5 checks for two-wheelers',
        blocks: [
          { ol: [
            '**Chain.** Clean, lubricate and adjust. A dry, slack chain can jump the sprocket on a long ride.',
            '**Brakes.** Adjust drum brakes and check disc pads. Riding with a pillion and luggage needs more braking than usual.',
            '**Tyres.** Correct pressure for two people, and replace tyres with nearly flat tread before the trip.',
            '**Lights and horn.** Headlamp, tail lamp, indicators and horn must all work, especially for early-morning ghat visits.',
            '**Oil.** Change it if it is due within 500 km. Old oil makes engines run hot in slow festive traffic.',
          ] },
          { tip: 'Book your service at least 5–7 days before Diwali. The last few days before the festival are the busiest of the year for every mechanic in the region.', title: 'Plan ahead' },
        ],
      },
      {
        id: 'on-the-road',
        h2: 'On the road: driving tips for festive traffic',
        blocks: [
          { ul: [
            'Start early. Traffic on NH-27 and around Gorakhpur, Deoria and Kasia builds up after 9 am on festival eves.',
            'Watch for pedestrians near ghats, markets and temples, especially on Chhath mornings and evenings.',
            'Keep a safe gap behind buses and trucks; they stop suddenly to pick up passengers.',
            'Do not overload the car. Extra weight changes braking and handling, and overloaded roof carriers are dangerous.',
            'If the temperature gauge rises in traffic, switch off the AC and turn on the heater to shed engine heat, then pull over safely.',
          ] },
          { cta: 'book' },
        ],
      },
      {
        id: 'breakdown',
        h2: 'If you break down on the way',
        blocks: [
          { p: 'Pull over as far left as possible, switch on the hazard lamps and place the warning triangle behind the car. Stay away from traffic. Then call **+91 93106 94349** or book [Roadside Assistance](/services) and share your live location. We arrange jump-starts, puncture repair, fuel delivery and towing across Gorakhpur, Deoria, Kushinagar and Maharajganj.' },
          { hi: 'दिवाली और छठ से पहले गाड़ी की सर्विस ज़रूर करवा लें — टायर, ब्रेक, बैटरी और लाइट्स की जांच सबसे ज़रूरी है। रास्ते में गाड़ी खराब हो जाए तो +91 93106 94349 पर कॉल करें।', title: 'हिंदी में संक्षेप' },
          { cta: 'roadside' },
        ],
      },
    ],
    faqs: [
      { q: 'How many days before Diwali should I service my car?', a: 'At least 5–7 days before. That leaves time to fix anything the mechanic finds and avoids the last-minute rush.' },
      { q: 'What is the most common festive-season breakdown?', a: 'A weak or dead battery, followed by punctures and overheating in traffic. A battery test, tyre check and coolant top-up prevent most of them.' },
      { q: 'Can I get a doorstep service before Chhath in a village near Deoria or Kushinagar?', a: 'Yes. Book doorstep service online or call us; enter your village and a landmark and the booking screen shows availability for your address.' },
    ],
    related: ['mechanic-in-gorakhpur', 'mechanic-in-deoria', 'mechanic-in-kushinagar', 'winter-fog-driving-nh27-safety'],
  },
  {
    slug: 'monsoon-flood-car-bike-care-purvanchal',
    kind: 'guide',
    category: 'Monsoon care',
    title: 'Monsoon & Flood Season Vehicle Care in Gorakhpur, Deoria and Kushinagar',
    metaTitle: 'Monsoon & Flood Vehicle Care Guide',
    description: 'Rapti, Ghaghara and Gandak floods are a yearly reality. How to protect your car or bike in the monsoon, and what to do if it goes into water.',
    excerpt: 'Waterlogged underpasses, river floods and muddy village roads: how to protect your engine, brakes and electricals, and what to do after water entry.',
    keywords: 'car flood damage Gorakhpur, bike in flood water what to do, monsoon car care tips UP, waterlogging car engine hydrolock, Gandak flood vehicle, Rapti flood car',
    datePublished: PUB,
    dateModified: PUB,
    readMins: 7,
    heroImg: '/design/nh-truck.webp',
    heroAlt: 'Bharat Mechanics roadside assistance tow truck',
    intro: 'Every monsoon, the Rapti and Rohini flood parts of Gorakhpur, the Ghaghara rises along Deoria’s southern edge and the Gandak spills over in northern Kushinagar. In cities, underpasses and low colonies waterlog within an hour of heavy rain. Water is the fastest way to turn a small repair into an engine replacement. Here is how to protect your vehicle, and what to do if it has already been in water.',
    sections: [
      {
        id: 'before',
        h2: 'Before the rains: a 20-minute monsoon check',
        blocks: [
          { ul: [
            '**Tyres:** tread must be deep enough to clear water. Bald tyres aquaplane on wet highways.',
            '**Wipers:** replace blades that streak or chatter. Rain on NH-27 at night with poor wipers is dangerous.',
            '**Brakes:** get pads and drums checked. Wet brakes lose grip; worn brakes lose even more.',
            '**Lights:** check every bulb, and clean foggy headlamp lenses.',
            '**Underbody and drains:** clear the sunroof and door drains, and consider an anti-rust underbody coat.',
            '**Electricals:** tighten battery terminals and ask the mechanic to check exposed connectors.',
          ] },
          { cta: 'book' },
        ],
      },
      {
        id: 'driving',
        h2: 'Driving through water: the safe way',
        blocks: [
          { p: 'The safest rule is simple: **if you cannot see the road, do not drive into it.** Water hides potholes, open drains and washed-out edges, which are common on village roads in the flood belt.' },
          { ul: [
            'Never enter water that reaches above the middle of your wheels in a car, or above the silencer in a bike.',
            'If you must cross shallow water, go slowly in first gear with steady revs, and do not stop or change gear midway.',
            'After crossing, press the brakes gently a few times to dry them.',
            'Avoid following close behind trucks and buses in water; their bow wave can push water into your air intake.',
          ] },
        ],
      },
      {
        id: 'after-water',
        h2: 'If your car or bike has been in flood water',
        blocks: [
          { tip: 'Do NOT try to start the engine. If water has entered the air intake, cranking the engine can bend the connecting rods — a failure called hydrolock that often costs more than the vehicle is worth to fix.', title: 'The one rule that saves engines' },
          { ol: [
            'Disconnect the battery if you can do it safely.',
            'Call **+91 93106 94349** or book [Roadside Assistance](/services) for a tow, not a jump-start.',
            'The mechanic should check the air filter and intake for water, drain and replace the engine oil if it looks milky, inspect spark plugs, and dry the electricals.',
            'Brakes, wheel bearings and the clutch (for bikes) need inspection too.',
            'Take photos and inform your insurer before repairs start — most comprehensive policies cover flood damage, but engine-protection add-ons matter for hydrolock.',
          ] },
          { cta: 'roadside' },
        ],
      },
      {
        id: 'after-season',
        h2: 'After the monsoon: the clean-up service',
        blocks: [
          { p: 'Once the rains end, book a service that includes an underbody wash, rust check, chain and cable lubrication, brake cleaning and an electrical inspection. Mud and moisture trapped under the car or in a bike’s chain cause rust that shows up months later.' },
          { hi: 'बाढ़ के पानी में गाड़ी चली गई हो तो इंजन स्टार्ट न करें — पहले मैकेनिक से जांच करवाएं। टो और सहायता के लिए +91 93106 94349 पर कॉल करें।', title: 'हिंदी में संक्षेप' },
        ],
      },
    ],
    faqs: [
      { q: 'Can I start my bike after it fell in water?', a: 'Not before checking it. Water in the engine or silencer must be drained first. Remove the spark plug, drain water from the silencer and air box, and change the oil if it looks milky — or book a mechanic to do it.' },
      { q: 'Does insurance cover flood damage to cars in UP?', a: 'Comprehensive policies usually cover flood damage, but engine damage from restarting a flooded engine (hydrolock) is often only covered with an engine-protection add-on. Check your policy and inform the insurer before repairs.' },
      { q: 'Which areas flood most in the region?', a: 'Low-lying colonies and underpasses in Gorakhpur city during heavy rain, villages near the Rapti and Ghaghara in Gorakhpur and Deoria, and the Gandak belt in northern Kushinagar (Khadda, Chhitauni, Nebua Naurangia).' },
    ],
    related: ['mechanic-in-gorakhpur', 'mechanic-in-khadda', 'mechanic-in-barhaj', 'mechanic-in-chhitauni'],
  },
  {
    slug: 'car-bike-service-cost-gorakhpur-2026',
    kind: 'guide',
    category: 'Price guide',
    title: 'Car & Bike Service Cost in Gorakhpur, Deoria and Kushinagar (2026 Price Guide)',
    metaTitle: 'Car Service Cost in Gorakhpur 2026',
    description: 'How much does a car service, oil change, AC service or battery replacement cost in Gorakhpur, Deoria and Kushinagar in 2026? Transparent price list.',
    excerpt: 'Starting prices for periodic service, oil change, brakes, AC, battery, alignment and roadside help — and what is included in each.',
    keywords: 'car service cost Gorakhpur, car service price Deoria, oil change price Kushinagar, AC gas refill price Gorakhpur, battery replacement price, bike service charges Gorakhpur 2026',
    datePublished: PUB,
    dateModified: PUB,
    readMins: 5,
    heroImg: '/design/p-engineoil.png',
    heroAlt: 'Engine oil for a car service',
    intro: 'The first question most people ask a mechanic is “kitna lagega?” — and the most common complaint afterwards is a bill that grew during the job. This guide lists Bharat Mechanics’ starting prices for the most-booked services in Gorakhpur, Deoria, Kushinagar and Maharajganj, what each includes, and how to avoid paying for work you did not need.',
    sections: [
      {
        id: 'price-list',
        h2: 'Service price list (starting prices, 2026)',
        blocks: [
          { table: {
            caption: 'Starting prices on Bharat Mechanics. Final price depends on vehicle model and parts, and is shown before you confirm.',
            head: ['Service', 'Starting price', 'Typical time', 'What is included'],
            rows: [
              ['Oil Change', '₹599', '45 min', 'Premium engine oil + oil filter, at your doorstep'],
              ['Roadside Assistance', '₹499', 'ETA shown at booking', 'Jump-start, flat tyre, fuel delivery or towing'],
              ['Wheel Alignment & Balancing', '₹799', '1 hr', 'Computerised alignment, balancing, tyre rotation'],
              ['Car Spa & Detailing', '₹899', '2–3 hrs', 'Foam wash, interior vacuum, polish'],
              ['Brake Service', '₹999', '1–2 hrs', 'Pad check, fluid top-up, rotor inspection, adjustment'],
              ['Denting & Painting', '₹1,499', '1 day', 'Dent removal, primer, paint match (per panel)'],
              ['AC Service & Gas Refill', '₹1,799', '2 hrs', 'Inspection, gas top-up, coil cleaning, odour removal'],
              ['Periodic Service', '₹2,499', '3–4 hrs', '30-point inspection, oil change, filter clean, top-ups'],
              ['Battery Replacement', '₹4,499', '45 min', 'Genuine battery, free fitting, old-battery buyback'],
            ],
          } },
          { p: 'Every service comes with a **30-day service warranty**, genuine parts with an invoice, and you **pay only after the job is done**. See live prices for your car on the [services page](/services).' },
        ],
      },
      {
        id: 'bike',
        h2: 'Bike service: what to expect',
        blocks: [
          { p: 'A standard two-wheeler service covers an oil change, air-filter clean, spark-plug check, chain clean and adjustment, brake adjustment, battery and electrical check and a test ride. The exact price depends on your bike model and is shown when you book. Parts such as brake shoes, chain sets or tyres are quoted separately, and nothing is replaced without your approval.' },
        ],
      },
      {
        id: 'avoid-overpaying',
        h2: 'How to avoid overpaying for vehicle service',
        blocks: [
          { ul: [
            '**Get the price before the work.** Ask for an itemised estimate; on Bharat Mechanics the price is on screen before you confirm.',
            '**Ask for old parts back.** It is the simplest proof that a part was actually replaced.',
            '**Insist on genuine parts with an invoice.** Cheap duplicates cost more over time.',
            '**Do not skip small jobs.** A ₹599 oil change on time prevents a ₹20,000 engine repair later.',
            '**Pay after service.** Check the work and test-drive before paying.',
          ] },
          { cta: 'book' },
        ],
      },
      {
        id: 'doorstep-vs-workshop',
        h2: 'Doorstep service vs workshop: which is cheaper?',
        blocks: [
          { p: 'For routine jobs — oil change, battery, brakes, AC gas top-up and minor repairs — doorstep service saves a trip, a day of waiting and often auto fare both ways. Jobs that need heavy equipment, like denting-painting or major engine work, are done at a partner workshop with pickup and drop. Either way, the price is fixed upfront.' },
          { hi: 'गोरखपुर, देवरिया और कुशीनगर में कार सर्विस ₹2,499 से, ऑयल चेंज ₹599 से और रोडसाइड सहायता ₹499 से शुरू। कीमत बुकिंग से पहले दिखती है और भुगतान सर्विस के बाद।', title: 'हिंदी में संक्षेप' },
        ],
      },
    ],
    faqs: [
      { q: 'How much does a car service cost in Gorakhpur?', a: 'A periodic car service on Bharat Mechanics starts at ₹2,499, and an oil change starts at ₹599. The exact price for your car model is shown before you confirm.' },
      { q: 'Are there hidden charges?', a: 'No. All charges are shown on the booking screen. Any extra part or job is quoted to you first, and you pay only after the service.' },
      { q: 'Is the price the same in Deoria and Kushinagar?', a: 'Starting prices are the same across our service areas. The final price depends on your vehicle and the parts needed, and is shown before booking.' },
    ],
    related: ['mechanic-in-gorakhpur', 'mechanic-in-deoria', 'mechanic-in-padrauna', 'diwali-chhath-road-trip-car-bike-checklist'],
  },
  {
    slug: 'sugarcane-season-road-safety-kushinagar-deoria',
    kind: 'guide',
    category: 'Road safety',
    title: 'Sugarcane Season Road Safety: Riding and Driving Around Mill Towns in Kushinagar and Deoria',
    metaTitle: 'Sugarcane Season Road Safety Tips',
    description: 'Cane-crushing season brings overloaded trolleys, mud and night traffic to Kushinagar, Deoria and Maharajganj roads. How to ride safely and care for your bike.',
    excerpt: 'Overloaded trolleys, slippery mud and unlit carts: practical safety tips and a vehicle checklist for the November–April crushing season.',
    keywords: 'sugarcane trolley accident safety, ganna season road safety Kushinagar, bike safety Ramkola Kaptanganj, tractor trolley reflector, mud road bike skid tips, Deoria cane season',
    datePublished: PUB,
    dateModified: PUB,
    readMins: 6,
    heroImg: '/design/sv-bike.webp',
    heroAlt: 'Motorcycle ready for safe riding on village roads',
    intro: 'From roughly November to April, the sugar mills of Kushinagar, Deoria and Maharajganj run day and night, and the roads around Ramkola, Kaptanganj, Khadda, Pipraich and Siswa fill with tractor-trolleys and bullock carts carrying cane. It is the region’s economic lifeline — and one of its biggest road-safety risks, especially for two-wheelers after dark.',
    sections: [
      {
        id: 'risks',
        h2: 'What makes cane season dangerous',
        blocks: [
          { ul: [
            '**Overloaded trolleys** that sway, shed cane and cannot stop quickly.',
            '**Poor lighting and missing reflectors** on trolleys and carts at night and in fog.',
            '**Mud and crushed cane** on the road, which is as slippery as ice for a bike tyre.',
            '**Queues near mill gates** that spill onto the highway.',
            '**Winter fog** that overlaps with the season from December to January.',
          ] },
        ],
      },
      {
        id: 'riding-tips',
        h2: 'Riding and driving tips',
        blocks: [
          { ol: [
            'Keep at least four seconds behind a trolley — cane can fall off without warning.',
            'Overtake only on a straight road with clear visibility, and never on the left.',
            'Slow down before muddy patches and do not brake hard while leaning a bike.',
            'Use low beam in fog and turn on hazard lamps if you have to stop on the road.',
            'Avoid riding at night during peak crushing weeks if you can; if not, wear a reflective jacket and a helmet with a clear visor.',
          ] },
        ],
      },
      {
        id: 'vehicle-check',
        h2: 'Vehicle checklist for the season',
        blocks: [
          { table: {
            head: ['Part', 'Why it matters', 'When to check'],
            rows: [
              ['Tyres', 'Grip on mud and crushed cane', 'Before November, then monthly'],
              ['Brakes', 'Stopping short behind trolleys', 'Before November'],
              ['Headlamp & tail lamp', 'Seeing and being seen at night and in fog', 'Before November'],
              ['Chain & sprockets', 'Mud accelerates wear', 'Every 2 weeks (clean & lube)'],
              ['Air filter', 'Dust and dried mud clog it', 'Every service'],
            ],
          } },
          { cta: 'book' },
        ],
      },
      {
        id: 'for-tractor-owners',
        h2: 'A note for trolley owners',
        blocks: [
          { p: 'Reflective tape on the back and sides of a trolley costs very little and saves lives. Working tail lamps, not overloading beyond the sides and avoiding night runs in dense fog protect both the driver and everyone else on the road.' },
          { hi: 'गन्ना सीज़न में ट्रॉली से कम से कम चार सेकंड की दूरी रखें, कीचड़ पर तेज़ ब्रेक न लगाएं और नवंबर से पहले टायर, ब्रेक और हेडलाइट की जांच करवाएं।', title: 'हिंदी में संक्षेप' },
        ],
      },
    ],
    faqs: [
      { q: 'When is sugarcane crushing season in Kushinagar and Deoria?', a: 'Mills in the region usually crush from around November until March or April, depending on the crop and the mill.' },
      { q: 'How do I clean cane mud from my bike?', a: 'Rinse with low-pressure water (not a jet on the bearings), clean and re-lube the chain, and clean the brake drums. A service after the season removes trapped mud before it causes rust.' },
      { q: 'Which towns see the most cane traffic?', a: 'Mill towns and their surroundings, including Ramkola, Kaptanganj, Khadda and Seorahi in Kushinagar, Pipraich in Gorakhpur district and Siswa in Maharajganj, plus the roads leading to them.' },
    ],
    related: ['mechanic-in-ramkola', 'mechanic-in-kaptanganj', 'mechanic-in-khadda', 'mechanic-in-pipraich'],
  },
  {
    slug: 'winter-fog-driving-nh27-safety',
    kind: 'guide',
    category: 'Road safety',
    title: 'Winter Fog on NH-27: Safe Driving Tips and Car Checks for Gorakhpur–Kushinagar',
    metaTitle: 'Fog Driving Tips for NH-27 Gorakhpur',
    description: 'Dense winter fog on NH-27 between Gorakhpur, Kasia and Tamkuhi causes pile-ups every year. Fog driving tips and the car checks that keep you visible.',
    excerpt: 'Low beam, safe gaps, hazard-lamp etiquette and the five car checks that matter before fog season on NH-27 and the Link Expressway.',
    keywords: 'fog driving tips NH 27, Gorakhpur fog accident, Kushinagar highway fog, car fog lamp check, winter car care UP, dense fog driving safety India',
    datePublished: PUB,
    dateModified: PUB,
    readMins: 5,
    heroImg: '/design/prod-headlight.png',
    heroAlt: 'Car headlamp for driving in fog',
    intro: 'From mid-December to late January, dense fog settles over the Gorakhpur plains at night and in the early morning. On NH-27 through Hata, Kasia, Fazilnagar and Tamkuhi, and on the Gorakhpur Link Expressway, visibility can fall to a few metres. Most fog crashes happen because drivers go too fast for what they can see, or because a vehicle ahead cannot be seen at all.',
    sections: [
      {
        id: 'checks',
        h2: 'Five car checks before fog season',
        blocks: [
          { ol: [
            '**Headlamps:** clean lenses, working low beam and correct alignment. Misaligned lamps light up the fog, not the road.',
            '**Fog lamps and tail lamps:** check front and rear fog lamps if fitted, plus all tail and brake lamps.',
            '**Wipers and washer:** fresh blades and full washer fluid; fog leaves a greasy film on the glass.',
            '**Defogger and AC:** the AC dries the air and clears the inside of the windscreen fastest.',
            '**Battery:** cold mornings expose weak batteries. Get it tested if the engine cranks slowly.',
          ] },
          { cta: 'book' },
        ],
      },
      {
        id: 'driving',
        h2: 'How to drive in dense fog',
        blocks: [
          { ul: [
            'Use **low beam**, never high beam. High beam reflects off the fog and blinds you.',
            'Drive at a speed that lets you stop within the distance you can see.',
            'Use the left edge line as a guide, not the tail lamps of the vehicle ahead.',
            'Do not use hazard lamps while moving — they confuse drivers about whether you are stopped. Use them only when stopped.',
            'If visibility is near zero, leave the highway completely at a dhaba, fuel station or service road and wait.',
            'Keep windows slightly open at junctions to hear traffic you cannot see.',
          ] },
          { tip: 'Two-wheelers are the hardest vehicles to see in fog. Wear a reflective jacket, keep the headlamp on and ride close to the left edge.', title: 'For bike riders' },
        ],
      },
      {
        id: 'breakdown',
        h2: 'If you break down in fog',
        blocks: [
          { p: 'Move the vehicle completely off the road if you can, switch on hazard lamps, place the warning triangle well behind, and wait away from the carriageway. Call **+91 93106 94349** or book [Roadside Assistance](/services) and share your live location.' },
          { hi: 'कोहरे में लो बीम पर चलें, हाई बीम नहीं। चलते समय हैज़र्ड लाइट न जलाएं, सिर्फ रुकने पर जलाएं। दिसंबर से पहले हेडलाइट, वाइपर और बैटरी की जांच करवाएं।', title: 'हिंदी में संक्षेप' },
          { cta: 'roadside' },
        ],
      },
    ],
    faqs: [
      { q: 'Should I use hazard lamps while driving in fog?', a: 'No. Hazard lamps are for a stopped vehicle. Using them while moving makes other drivers think you have stopped and can cause collisions.' },
      { q: 'Are yellow fog lamps better?', a: 'Properly aimed fog lamps mounted low help you see the road edge. The colour matters less than correct aiming and clean lenses. Aftermarket lamps must not dazzle other drivers.' },
      { q: 'When is fog worst on NH-27 near Gorakhpur and Kushinagar?', a: 'Usually from mid-December to late January, between late night and mid-morning.' },
    ],
    related: ['mechanic-in-kasia', 'mechanic-in-hata', 'mechanic-in-tamkuhi-raj', 'diwali-chhath-road-trip-car-bike-checklist'],
  },
]
