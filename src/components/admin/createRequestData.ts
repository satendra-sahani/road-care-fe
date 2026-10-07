// Pick-lists for the admin "Create Service Request" dialog (CreateRequestDialog.tsx).
// Brand / model are suggestions only — the inputs accept anything the caller says.

export type VehicleKind = 'bike' | 'scooter' | 'car' | 'auto' | 'truck'

export const VEHICLE_KINDS: { key: VehicleKind; label: string }[] = [
  { key: 'bike', label: 'Bike' },
  { key: 'scooter', label: 'Scooter' },
  { key: 'car', label: 'Car' },
  { key: 'auto', label: 'Auto' },
  { key: 'truck', label: 'Truck' },
]

export const BRANDS: Record<VehicleKind, string[]> = {
  bike: ['Hero', 'Honda', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha', 'Suzuki', 'KTM', 'Jawa', 'Yezdi'],
  scooter: ['Honda', 'TVS', 'Suzuki', 'Hero', 'Yamaha', 'Ola Electric', 'Ather', 'Bajaj', 'Vespa', 'Aprilia'],
  car: ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'Renault', 'Volkswagen', 'Skoda', 'MG', 'Nissan', 'Ford'],
  auto: ['Bajaj', 'Piaggio', 'TVS', 'Mahindra', 'Atul'],
  truck: ['Tata', 'Ashok Leyland', 'Mahindra', 'Eicher', 'BharatBenz', 'Force'],
}

/** keyed by `${kind}:${brand}` */
export const MODELS: Record<string, string[]> = {
  'bike:Hero': ['Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Super Splendor', 'Xtreme 160R'],
  'bike:Honda': ['Shine', 'SP 125', 'Unicorn', 'Hornet 2.0', 'CB350', 'Livo'],
  'bike:Bajaj': ['Pulsar 150', 'Pulsar NS200', 'Platina', 'CT 100', 'Avenger', 'Dominar 400'],
  'bike:TVS': ['Apache RTR 160', 'Raider', 'Sport', 'Star City Plus', 'Radeon', 'Ronin'],
  'bike:Royal Enfield': ['Classic 350', 'Bullet 350', 'Hunter 350', 'Meteor 350', 'Himalayan'],
  'bike:Yamaha': ['FZ', 'FZ-S', 'R15', 'MT-15'],
  'bike:Suzuki': ['Gixxer', 'Gixxer SF', 'V-Strom SX'],
  'bike:KTM': ['Duke 200', 'Duke 250', 'Duke 390', 'RC 200'],
  'scooter:Honda': ['Activa', 'Activa 125', 'Dio', 'Grazia'],
  'scooter:TVS': ['Jupiter', 'NTorq 125', 'iQube', 'Scooty Pep+', 'Zest'],
  'scooter:Suzuki': ['Access 125', 'Burgman Street', 'Avenis'],
  'scooter:Hero': ['Pleasure+', 'Destini 125', 'Maestro Edge', 'Xoom'],
  'scooter:Yamaha': ['Fascino', 'RayZR', 'Aerox 155'],
  'scooter:Ola Electric': ['S1 Pro', 'S1 Air', 'S1 X'],
  'scooter:Ather': ['450X', '450S', 'Rizta'],
  'scooter:Bajaj': ['Chetak'],
  'car:Maruti Suzuki': ['Swift', 'Baleno', 'WagonR', 'Alto', 'Dzire', 'Ertiga', 'Brezza', 'Celerio', 'Eeco'],
  'car:Hyundai': ['Grand i10', 'i20', 'Creta', 'Venue', 'Verna', 'Aura', 'Santro'],
  'car:Tata': ['Nexon', 'Punch', 'Tiago', 'Altroz', 'Harrier', 'Tigor', 'Safari'],
  'car:Mahindra': ['Scorpio', 'Bolero', 'XUV700', 'XUV300', 'Thar'],
  'car:Toyota': ['Innova', 'Fortuner', 'Glanza', 'Urban Cruiser', 'Etios'],
  'car:Honda': ['City', 'Amaze', 'Jazz', 'WR-V'],
  'car:Kia': ['Seltos', 'Sonet', 'Carens'],
  'car:Renault': ['Kwid', 'Triber', 'Kiger', 'Duster'],
  'auto:Bajaj': ['RE', 'Maxima'],
  'auto:Piaggio': ['Ape'],
  'auto:TVS': ['King'],
  'truck:Tata': ['Ace', 'Intra', '407', 'Yodha'],
  'truck:Mahindra': ['Bolero Pickup', 'Jeeto', 'Supro'],
  'truck:Ashok Leyland': ['Dost', 'Bada Dost', 'Partner'],
  'truck:Eicher': ['Pro 2049', 'Pro 2059'],
}

export const SERVICES = [
  "Engine Won't Start", 'Battery / Jump-start', 'Puncture', 'General Service',
  'Engine Repair', 'Electrical', 'Brake Issue', 'Towing', 'Other',
]

export const SERVICE_TYPES: { key: 'home' | 'roadside' | 'walkin'; label: string; hint: string }[] = [
  { key: 'home', label: 'Doorstep', hint: 'Mechanic goes to the customer’s home / office' },
  { key: 'roadside', label: 'Roadside', hint: 'Vehicle is stuck on the road' },
  { key: 'walkin', label: 'Walk-in', hint: 'Customer brings the vehicle to a garage' },
]

export const PRIORITIES: { key: 'low' | 'medium' | 'high' | 'urgent'; label: string; fg: string; bg: string }[] = [
  { key: 'low', label: 'Low', fg: '#15803D', bg: '#DCFCE7' },
  { key: 'medium', label: 'Normal', fg: '#1D4ED8', bg: '#DBEAFE' },
  { key: 'high', label: 'High', fg: '#C2410C', bg: '#FFEDD5' },
  { key: 'urgent', label: 'Emergency', fg: '#FFFFFF', bg: '#DC2626' },
]

export const TIME_SLOTS = ['8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '12:00 PM – 2:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM', '6:00 PM – 8:00 PM']
