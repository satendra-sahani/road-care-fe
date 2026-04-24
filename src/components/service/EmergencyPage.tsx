'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { servicePricingAPI, userServiceAPI } from '@/services/api';
import {
  AlertTriangle, ArrowLeft, MapPin, Clock, CheckCircle,
  Loader2, Car, Bike, AlertCircle, Battery, Fuel, Key, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyService {
  id: string;
  label: string;
  icon: string;
  description: string;
  estimatedTime: string;
  urgencyLevel: 'high' | 'medium';
  price: number;
  isActive: boolean;
}

const FALLBACK_EMERGENCY_SERVICES: EmergencyService[] = [
  { id: 'breakdown', label: 'Vehicle Breakdown', icon: 'warning', description: "Engine stopped, won't start, or major issue", estimatedTime: '15-30 mins', urgencyLevel: 'high', price: 0, isActive: true },
  { id: 'accident', label: 'Accident Assistance', icon: 'medical', description: 'Minor accident, vehicle damage support', estimatedTime: '20-45 mins', urgencyLevel: 'high', price: 0, isActive: true },
  { id: 'puncture', label: 'Flat Tyre', icon: 'ellipse-outline', description: 'Tyre puncture or flat tyre emergency', estimatedTime: '10-20 mins', urgencyLevel: 'medium', price: 0, isActive: true },
  { id: 'battery', label: 'Battery Dead', icon: 'battery-dead', description: "Vehicle won't start, battery issues", estimatedTime: '15-30 mins', urgencyLevel: 'medium', price: 0, isActive: true },
  { id: 'fuel', label: 'Out of Fuel', icon: 'speedometer', description: 'Ran out of fuel, need emergency supply', estimatedTime: '20-40 mins', urgencyLevel: 'medium', price: 0, isActive: true },
  { id: 'locked', label: 'Keys Locked Inside', icon: 'key', description: 'Locked out of vehicle, key assistance', estimatedTime: '15-25 mins', urgencyLevel: 'medium', price: 0, isActive: true },
];

const VEHICLE_TYPES = [
  { type: 'bike', label: 'Bike', Icon: Bike },
  { type: 'scooter', label: 'Scooter', Icon: Bike },
  { type: 'car', label: 'Car', Icon: Car },
  { type: 'auto', label: 'Auto', Icon: Car },
];

const SERVICE_ICONS: Record<string, typeof AlertTriangle> = {
  breakdown: AlertTriangle,
  accident: AlertCircle,
  puncture: AlertCircle,
  battery: Battery,
  fuel: Fuel,
  locked: Key,
};

export default function EmergencyPage() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>(FALLBACK_EMERGENCY_SERVICES);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [step, setStep] = useState<'select' | 'location' | 'confirm'>('select');

  useEffect(() => {
    fetchEmergencyServices(selectedVehicle);
  }, [selectedVehicle]);

  const fetchEmergencyServices = async (vehicleType: string) => {
    setLoadingServices(true);
    setSelectedService(null);
    try {
      const res = await servicePricingAPI.getByVehicle(vehicleType);
      const data = res.data?.data || res.data;
      if (data?.emergencyServices?.length > 0) {
        const active = data.emergencyServices.filter((s: EmergencyService) => s.isActive);
        setEmergencyServices(active.length > 0 ? active : FALLBACK_EMERGENCY_SERVICES);
      } else {
        setEmergencyServices(FALLBACK_EMERGENCY_SERVICES);
      }
    } catch {
      setEmergencyServices(FALLBACK_EMERGENCY_SERVICES);
    } finally {
      setLoadingServices(false);
    }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = pos.coords;

      // Reverse geocode with Nominatim
      let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const geo = await resp.json();
        if (geo.display_name) address = geo.display_name;
      } catch {}

      setLocation({ lat: latitude, lng: longitude, address });
      setStep('confirm');
    } catch {
      toast.error('Could not get your location. Please enable GPS and try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !location) return;
    setSubmitting(true);
    try {
      const serviceData = emergencyServices.find((s) => s.id === selectedService);
      // Payload shape must match the backend validator and the Android
      // ServiceConfirmationScreen.tsx contract — flat address/coords, required
      // serviceType ('home' | 'roadside' | 'walkin'), serviceCategory,
      // description, address, preferredDate.
      const res = await userServiceAPI.create({
        serviceType: 'roadside',
        serviceCategory: selectedService,
        description: serviceData?.description || serviceData?.label || selectedService,
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
        preferredDate: new Date().toISOString(),
        priority: 'high',
        isEmergency: true,
        vehicleType: selectedVehicle,
        issues: [selectedService],
        estimatedCost: serviceData?.price && serviceData.price > 0 ? serviceData.price : 199,
        paymentMethod: 'cod',
      });

      const data = res.data?.data || res.data;
      toast.success('Emergency request submitted! A mechanic is being dispatched.');
      const newId = data?._id || data?.serviceRequest?._id || data?.id;
      if (newId) {
        router.push(`/service/${newId}`);
      } else {
        router.push('/service');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit emergency request');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedServiceData = emergencyServices.find((s) => s.id === selectedService);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Emergency Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <h1 className="text-xl font-bold">Emergency Assistance</h1>
              </div>
              <p className="text-sm text-red-100 mt-0.5">Get immediate roadside help</p>
            </div>
          </div>

          {/* SOS Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                setSelectedService('breakdown');
                setStep('location');
                if (!location) getLocation();
              }}
              className="h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 border-4 border-white shadow-xl flex flex-col items-center justify-center hover:scale-105 transition-transform animate-pulse"
            >
              <AlertCircle className="h-8 w-8 text-red-600" />
              <span className="text-lg font-black text-red-600">SOS</span>
            </button>
            <p className="text-sm text-red-100 font-semibold mt-3">
              Tap for immediate emergency assistance
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle Selection */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Your Vehicle</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VEHICLE_TYPES.map((v) => {
              const VIcon = v.Icon;
              return (
                <button
                  key={v.type}
                  onClick={() => setSelectedVehicle(v.type)}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all ${
                    selectedVehicle === v.type
                      ? 'bg-red-600 border-red-600 text-white shadow-lg'
                      : 'bg-white border-red-100 text-red-600 hover:border-red-300'
                  }`}
                >
                  <VIcon className="h-6 w-6" />
                  <span className="text-sm font-semibold">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Services */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">What&apos;s the Emergency?</h2>
          <p className="text-sm text-gray-500 mb-4">Select the type of assistance you need</p>

          {loadingServices ? (
            <div className="flex flex-col items-center py-10">
              <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
              <p className="text-sm text-gray-500 mt-3">Loading services...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyServices.map((service) => {
                const SIcon = SERVICE_ICONS[service.id] || AlertTriangle;
                const isSelected = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'bg-red-600 border-red-600 text-white shadow-lg'
                        : service.urgencyLevel === 'high'
                        ? 'bg-white border-red-100 hover:border-red-300'
                        : 'bg-white border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-white/20'
                            : service.urgencyLevel === 'high'
                            ? 'bg-red-50'
                            : 'bg-orange-50'
                        }`}
                      >
                        <SIcon
                          className={`h-6 w-6 ${
                            isSelected
                              ? 'text-white'
                              : service.urgencyLevel === 'high'
                              ? 'text-red-500'
                              : 'text-orange-500'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {service.label}
                        </p>
                        <p className={`text-sm mt-0.5 ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className={`h-3.5 w-3.5 ${isSelected ? 'text-red-200' : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${isSelected ? 'text-red-200' : 'text-gray-400'}`}>
                              {service.estimatedTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {service.price > 0 && (
                              <span className={`text-sm font-bold ${isSelected ? 'text-red-200' : 'text-red-600'}`}>
                                ₹{service.price}
                              </span>
                            )}
                            {service.urgencyLevel === 'high' && (
                              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                HIGH
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-6 w-6 text-white flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Summary */}
        {selectedServiceData && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 border border-red-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-800">Ready to Request Help</p>
                <p className="text-sm text-red-600">
                  {selectedServiceData.label} for your{' '}
                  {VEHICLE_TYPES.find((v) => v.type === selectedVehicle)?.label}
                  {selectedServiceData.price > 0 ? ` · Est. ₹${selectedServiceData.price}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location step */}
        {step === 'location' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Share Your Location
            </h3>
            {location ? (
              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800 mb-4">
                <p className="font-medium">Location detected:</p>
                <p className="mt-1 text-green-700 line-clamp-2">{location.address}</p>
              </div>
            ) : null}
            <button
              onClick={getLocation}
              disabled={locationLoading}
              className="w-full bg-red-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
            >
              {locationLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              {locationLoading ? 'Getting location...' : location ? 'Update Location' : 'Get My Location'}
            </button>
          </div>
        )}

        {/* Confirm step */}
        {step === 'confirm' && location && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Location Confirmed
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">{location.address}</p>
            <button
              onClick={() => { setStep('location'); getLocation(); }}
              className="text-sm text-red-600 font-medium underline"
            >
              Change location
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
          {step === 'select' ? (
            <button
              onClick={() => {
                if (!selectedService) {
                  toast.error('Please select the type of emergency assistance you need.');
                  return;
                }
                setStep('location');
                if (!location) getLocation();
              }}
              disabled={!selectedService}
              className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition ${
                selectedService
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MapPin className="h-5 w-5" />
              Share Location & Get Help
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !location || !selectedService}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              {submitting ? 'Requesting...' : 'Request Emergency Help Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
