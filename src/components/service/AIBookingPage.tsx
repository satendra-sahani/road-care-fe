'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAIBooking, ChatMessage, ProductCard } from '@/hooks/useAIBooking';
import { aiBookingAPI, userAddressAPI, userPaymentAPI, userOrderAPI } from '@/services/api';
import {
  ArrowLeft, Mic, MicOff, Send, Loader2, VolumeX,
  RotateCcw, Bot, User, MapPin, Navigation,
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window { Razorpay: any }
}

// Reverse geocode via Nominatim (free, no API key needed)
const reverseGeocode = async (lat: number, lng: number): Promise<{
  address: string; city: string; state: string; pincode: string; landmark: string;
} | null> => {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`
    );
    const data = await resp.json();
    if (!data?.address) return null;

    const a = data.address;
    const addrLine = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ');
    return {
      address: data.display_name || addrLine || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: a.city || a.town || a.village || a.state_district || '',
      state: a.state || '',
      pincode: a.postcode || '',
      landmark: a.suburb || a.neighbourhood || '',
    };
  } catch {
    return null;
  }
};

export default function AIBookingPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');

  // Booking state
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStep, setBookingStep] = useState('');
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const [bookedRequestId, setBookedRequestId] = useState<string | null>(null);

  // GPS / address
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<{
    address: string; city: string; state: string; pincode: string; landmark: string;
  } | null>(null);
  const gpsProcessingRef = useRef(false);

  // Product selection tracking (real MongoDB _id)
  const selectedProductRef = useRef<ProductCard | null>(null);

  // User data from Redux
  const user = useSelector((state: RootState) => state.customerAuth.user);
  const userData = user as any;
  const userName = userData?.fullName || userData?.name || 'User';

  const ai = useAIBooking(userName);

  // ─── Get user location on mount ──────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        const geo = await reverseGeocode(coords.lat, coords.lng);
        if (geo) setResolvedAddress(geo);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ─── Auto-start conversation on mount (like Android) ─────────────────
  useEffect(() => {
    ai.startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-scroll to bottom ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ai.messages, ai.partialText]);

  // ─── Auto-send speech result when recognition stops ──────────────────
  useEffect(() => {
    if (!ai.isListening && ai.partialText && !ai.isProcessing) {
      const text = ai.partialText.trim();
      if (text) ai.sendMessage(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.isListening]);

  // ─── AUTO-LISTEN: Start listening after AI finishes speaking ─────────
  // 2.5s delay to prevent echo. Don't auto-listen when products showing.
  const lastMessageHasProducts = ai.messages.length > 0 &&
    ai.messages[ai.messages.length - 1]?.products?.length;

  useEffect(() => {
    if (
      !ai.isSpeaking &&
      ai.messages.length > 0 &&
      !ai.isProcessing &&
      !ai.isListening &&
      !ai.isComplete &&
      !isBooking &&
      !bookingCompleted &&
      !gpsProcessingRef.current &&
      !lastMessageHasProducts &&
      ai.sttSupported
    ) {
      const timer = setTimeout(() => {
        if (!ai.isSpeaking && !ai.isProcessing && !ai.isListening) {
          ai.startListening();
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.isSpeaking, ai.isProcessing, ai.isComplete, isBooking, bookingCompleted, lastMessageHasProducts]);

  // ─── GPS_REQUESTED: When AI requests GPS address, fetch and send back ─
  useEffect(() => {
    if (
      (ai.step === 'address_change' || ai.step === 'product_address') &&
      ai.collectedData.newAddress === 'GPS_REQUESTED' &&
      !gpsProcessingRef.current
    ) {
      gpsProcessingRef.current = true;
      handleGPSAddressRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.step, ai.collectedData.newAddress]);

  // ─── Auto-confirm booking when AI says confirmed ─────────────────────
  useEffect(() => {
    if (ai.isComplete && ai.isConfirmed && !isBooking && !bookingCompleted) {
      if (ai.collectedData.flowType === 'product' || ai.collectedData.flowType === 'product_order') {
        handleProductOrderConfirm();
      } else {
        handleBookingConfirm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.isComplete, ai.isConfirmed]);

  // ─── GPS Address Request Handler ─────────────────────────────────────
  const handleGPSAddressRequest = async () => {
    try {
      if (!navigator.geolocation) {
        ai.sendMessage('GPS available nahi hai, manually bata deta hun');
        gpsProcessingRef.current = false;
        return;
      }

      // Request mic/location permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {}

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          const geo = await reverseGeocode(coords.lat, coords.lng);

          if (geo) {
            setResolvedAddress(geo);
            ai.sendMessage(`Mera address hai: ${geo.address}`);
          } else {
            ai.sendMessage('Location se address nahi mil paya, manually bata deta hun');
          }
          gpsProcessingRef.current = false;
        },
        () => {
          ai.sendMessage('Location nahi mil payi, manually address bata deta hun');
          gpsProcessingRef.current = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch {
      ai.sendMessage('GPS mein error aaya, manually address bata deta hun');
      gpsProcessingRef.current = false;
    }
  };

  // ─── Booking Confirmation (Service/Mechanic) ─────────────────────────
  const handleBookingConfirm = async () => {
    setIsBooking(true);
    setBookingStep('Booking ho rahi hai...');

    try {
      const addr = resolvedAddress;
      const aiNewAddr = ai.collectedData.newAddress;
      const manualAddress = (aiNewAddr && aiNewAddr !== 'GPS_REQUESTED') ? aiNewAddr : null;

      const confirmResult = await aiBookingAPI.confirm({
        collectedData: {
          vehicleType: ai.collectedData.vehicleType || 'bike',
          problem: ai.collectedData.problem || 'General service',
          problemDetails: ai.collectedData.problemDetails || undefined,
          preferredDate: ai.collectedData.preferredDate || undefined,
          preferredTimeSlot: ai.collectedData.preferredTimeSlot || undefined,
          paymentMethod: (ai.collectedData.paymentMethod as 'online' | 'cod') || 'cod',
        },
        address: manualAddress || addr?.address || userData?.location?.address || userData?.city || 'Home Service',
        landmark: addr?.landmark || userData?.location?.landmark || '',
        city: addr?.city || userData?.location?.city || userData?.city || '',
        state: addr?.state || userData?.location?.state || '',
        pincode: addr?.pincode || userData?.location?.pincode || '',
        ...(userCoords ? { latitude: userCoords.lat, longitude: userCoords.lng } : {}),
      });

      const data = confirmResult.data?.data || confirmResult.data;
      if (!data) throw new Error('Booking failed');

      const serviceRequestId = data._id || data.id || '';
      if (!serviceRequestId) throw new Error('Service request ID not returned');

      if (ai.collectedData.paymentMethod === 'online') {
        await handleOnlinePayment(serviceRequestId);
      } else {
        // COD: create COD record
        setBookingStep('Confirm ho raha hai...');
        try { await userPaymentAPI.createCOD(serviceRequestId, 99); } catch {}
        showOrderInChat(serviceRequestId, 'cod');
      }
    } catch (error: any) {
      setIsBooking(false);
      setBookingStep('');
      toast.error(error.message || 'Could not create booking. Please try again.');
    }
  };

  // ─── Online Payment (Service) ────────────────────────────────────────
  const handleOnlinePayment = async (serviceRequestId: string) => {
    if (typeof window.Razorpay === 'undefined') {
      setIsBooking(false);
      setBookingStep('');
      ai.addAssistantMessage('Payment module abhi ready nahi hai. Cash on Service mein book kar diya hai!');
      try { await userPaymentAPI.createCOD(serviceRequestId, 99); } catch {}
      showOrderInChat(serviceRequestId, 'cod');
      return;
    }

    setBookingStep('Payment setup...');
    let orderResult: any;
    try {
      const res = await userPaymentAPI.createOrder(serviceRequestId, 99);
      orderResult = res.data?.data || res.data;
    } catch (e: any) {
      setIsBooking(false);
      setBookingStep('');
      toast.error(e?.message || 'Payment setup failed. Please try COD instead.');
      return;
    }

    if (!orderResult?.orderId || !orderResult?.keyId) {
      setIsBooking(false);
      setBookingStep('');
      toast.error('Payment gateway not configured.');
      return;
    }

    setBookingStep('Payment open ho raha hai...');
    setIsBooking(false);

    try {
      const rzp = new window.Razorpay({
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency || 'INR',
        name: 'Bharat Mechanics',
        description: 'Bharat Mechanics - AI Booking',
        order_id: orderResult.orderId,
        prefill: { contact: userData?.phone || '' },
        theme: { color: '#7C3AED' },
        handler: async (response: any) => {
          setIsBooking(true);
          setBookingStep('Payment verify ho raha hai...');
          try {
            await userPaymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            showOrderInChat(serviceRequestId, 'online');
          } catch {
            setIsBooking(false);
            setBookingStep('');
            ai.addAssistantMessage('Payment verify nahi ho payi. Please dobara try karein.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsBooking(false);
            setBookingStep('');
            ai.addAssistantMessage('Payment cancel ho gayi. Koi baat nahi! Dobara try karna chahein to bol dena.');
          },
        },
      });
      rzp.open();
    } catch {
      setIsBooking(false);
      setBookingStep('');
      ai.addAssistantMessage('Payment nahi ho payi. Please dobara try karein ya COD choose karein.');
    }
  };

  // ─── Show booking order details in chat ──────────────────────────────
  const showOrderInChat = (requestId: string, paymentType: string) => {
    setIsBooking(false);
    setBookingStep('');
    setBookedRequestId(requestId);
    setBookingCompleted(true);

    const isHindi = ai.collectedData.language !== 'english';
    const vehicleEmoji = ai.collectedData.vehicleType === 'car' ? '🚗' :
                         ai.collectedData.vehicleType === 'scooter' ? '🛵' :
                         ai.collectedData.vehicleType === 'auto' ? '🛺' : '🏍️';
    const paymentLabel = paymentType === 'online' ? 'Online (Paid ✅)' : 'Cash on Service';
    const addr = resolvedAddress?.address || userData?.location?.address || userData?.city || '';

    const orderMsg = isHindi
      ? `✅ Booking Ho Gayi! 🎉\n\n📋 Request ID: #${requestId.slice(-6).toUpperCase()}\n${vehicleEmoji} Vehicle: ${ai.collectedData.vehicleType || 'N/A'}\n🔧 Problem: ${ai.collectedData.problem || 'N/A'}\n📅 Date: ${ai.collectedData.preferredDate || 'Today'}\n⏰ Time: ${ai.collectedData.preferredTimeSlot || '10:00 AM - 12:00 PM'}\n📍 Address: ${addr}\n💰 Payment: ${paymentLabel}\n\nMechanic jaldi assign hoga aapke paas. App mein track kar sakte ho! 🔧`
      : `✅ Booking Confirmed! 🎉\n\n📋 Request ID: #${requestId.slice(-6).toUpperCase()}\n${vehicleEmoji} Vehicle: ${ai.collectedData.vehicleType || 'N/A'}\n🔧 Problem: ${ai.collectedData.problem || 'N/A'}\n📅 Date: ${ai.collectedData.preferredDate || 'Today'}\n⏰ Time: ${ai.collectedData.preferredTimeSlot || '10:00 AM - 12:00 PM'}\n📍 Address: ${addr}\n💰 Payment: ${paymentLabel}\n\nA mechanic will be assigned to you shortly. Track it in the app! 🔧`;

    ai.addAssistantMessage(orderMsg);
  };

  // ─── Product Order Confirmation ──────────────────────────────────────
  const handleProductOrderConfirm = async () => {
    setIsBooking(true);
    setBookingStep('Order place ho raha hai...');

    try {
      const addr = resolvedAddress;
      const aiNewAddr = ai.collectedData.newAddress;
      const manualAddress = (aiNewAddr && aiNewAddr !== 'GPS_REQUESTED') ? aiNewAddr : null;

      const realProductId = selectedProductRef.current?._id || ai.collectedData.selectedProductId || '';
      if (!realProductId) {
        throw new Error('Product not selected. Please select a product first.');
      }

      const confirmResult = await aiBookingAPI.confirmOrder({
        productId: realProductId,
        quantity: ai.collectedData.quantity || 1,
        paymentMethod: (ai.collectedData.paymentMethod as 'online' | 'cod') || 'cod',
        address: manualAddress || addr?.address || userData?.location?.address || userData?.city || '',
        landmark: addr?.landmark || userData?.location?.landmark || '',
        city: addr?.city || userData?.location?.city || userData?.city || '',
        state: addr?.state || userData?.location?.state || '',
        pincode: addr?.pincode || userData?.location?.pincode || '',
        ...(userCoords ? { latitude: userCoords.lat, longitude: userCoords.lng } : {}),
      });

      const data = confirmResult.data?.data || confirmResult.data;
      if (!data) throw new Error('Order failed');

      const orderId = data.orderId || data._id || data.id || '';

      if (ai.collectedData.paymentMethod === 'online' && data.razorpay) {
        await handleProductOnlinePayment(orderId, data.razorpay);
      } else {
        showProductOrderInChat(orderId);
      }
    } catch (error: any) {
      setIsBooking(false);
      setBookingStep('');
      toast.error(error.message || 'Could not place order. Please try again.');
    }
  };

  // ─── Product Online Payment ──────────────────────────────────────────
  const handleProductOnlinePayment = async (orderId: string, razorpayData: any) => {
    if (typeof window.Razorpay === 'undefined') {
      setIsBooking(false);
      ai.addAssistantMessage('Payment module abhi ready nahi hai. COD mein order place kar diya hai!');
      showProductOrderInChat(orderId);
      return;
    }

    setBookingStep('Payment open ho raha hai...');
    setIsBooking(false);

    try {
      const rzp = new window.Razorpay({
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: 'Bharat Mechanics',
        description: 'Bharat Mechanics - Product Order',
        order_id: razorpayData.orderId,
        prefill: { contact: userData?.phone || '' },
        theme: { color: '#7C3AED' },
        handler: async (response: any) => {
          setIsBooking(true);
          setBookingStep('Payment verify ho raha hai...');
          try {
            await userOrderAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            showProductOrderInChat(orderId);
          } catch {
            setIsBooking(false);
            setBookingStep('');
            ai.addAssistantMessage('Payment verify nahi ho payi. Please dobara try karein.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsBooking(false);
            setBookingStep('');
            ai.addAssistantMessage('Payment cancel ho gayi. Koi baat nahi! Dobara try karna chahein to bol dena.');
          },
        },
      });
      rzp.open();
    } catch {
      setIsBooking(false);
      setBookingStep('');
      ai.addAssistantMessage('Payment nahi ho payi. Please dobara try karein ya COD choose karein.');
    }
  };

  // ─── Show product order details in chat ──────────────────────────────
  const showProductOrderInChat = (orderId: string) => {
    setIsBooking(false);
    setBookingStep('');
    setBookedRequestId(orderId);
    setBookingCompleted(true);

    const isHindi = ai.collectedData.language !== 'english';
    const productName = selectedProductRef.current?.name || ai.collectedData.selectedProductName || 'Product';
    const price = selectedProductRef.current?.price?.selling || ai.collectedData.selectedProductPrice || 0;
    const qty = ai.collectedData.quantity || 1;
    const total = price * qty;
    const paymentLabel = ai.collectedData.paymentMethod === 'online' ? 'Online (Paid)' : 'Cash on Delivery';
    const addr = resolvedAddress?.address || userData?.location?.address || userData?.city || '';

    const orderMsg = isHindi
      ? `Order Ho Gaya! \n\nOrder ID: #${String(orderId).slice(-6).toUpperCase()}\nProduct: ${productName}\nPrice: ₹${price} x ${qty} = ₹${total}\nAddress: ${addr}\nPayment: ${paymentLabel}\n\nJaldi deliver hoga aapke paas!`
      : `Order Confirmed! \n\nOrder ID: #${String(orderId).slice(-6).toUpperCase()}\nProduct: ${productName}\nPrice: ₹${price} x ${qty} = ₹${total}\nAddress: ${addr}\nPayment: ${paymentLabel}\n\nYour order will be delivered soon!`;

    ai.addAssistantMessage(orderMsg);
  };

  // ─── Product card selection handler ──────────────────────────────────
  const handleProductSelect = (product: ProductCard) => {
    selectedProductRef.current = product;
    const isHindi = ai.collectedData.language !== 'english';
    const msg = isHindi
      ? `Maine "${product.name}" select kiya — ₹${product.price.selling} [ProductID:${product._id}]`
      : `I selected "${product.name}" — ₹${product.price.selling} [ProductID:${product._id}]`;
    ai.sendMessage(msg);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    ai.sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicPress = () => {
    if (ai.isListening) {
      ai.stopListening();
    } else {
      ai.startListening();
    }
  };

  const navigateToTracking = () => {
    if (bookedRequestId) {
      if (ai.collectedData.flowType === 'product' || ai.collectedData.flowType === 'product_order') {
        router.push(`/orders/${bookedRequestId}`);
      } else {
        router.push(`/service/${bookedRequestId}`);
      }
    } else {
      router.push('/');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8F7FC]">
      {/* Header — Bharat AI branded (purple gradient like Android) */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white px-4 py-3 flex items-center gap-3 shadow-lg flex-shrink-0">
        <button
          onClick={() => {
            ai.stopSpeaking();
            router.back();
          }}
          className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/25 flex items-center justify-center">
            <span className="text-lg font-extrabold">B</span>
          </div>
          <div>
            <p className="font-bold text-[15px]">Bharat AI</p>
            <p className="text-[11px] text-white/80">
              {ai.isProcessing ? 'Soch raha hai...' : ai.isSpeaking ? '🔊 Bol raha hai...' : ai.isListening ? '🎙 Sun raha hai...' : '● Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ai.isSpeaking && (
            <button
              onClick={ai.stopSpeaking}
              className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <VolumeX className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => {
              ai.reset();
              setIsBooking(false);
              setBookingStep('');
              setBookingCompleted(false);
              setBookedRequestId(null);
              selectedProductRef.current = null;
              gpsProcessingRef.current = false;
              setTimeout(() => ai.startConversation(), 100);
            }}
            className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className={`w-2.5 h-2.5 rounded-full border-2 border-white/30 ${ai.isProcessing ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
        </div>
      </div>

      {/* Chat Messages — brand-logo watermark in the centre. The 92%-opacity
          overlay (matching the parent #F8F7FC bg) keeps the logo subtle so
          chat bubbles remain readable. backgroundAttachment defaults to
          'scroll' so the watermark stays anchored to the chat area while
          messages scroll over it. */}
      <div
        className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(248,247,252,0.92), rgba(248,247,252,0.92)), url(/brand-logo.png)',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundPosition: 'center, center',
          backgroundSize: 'cover, min(280px, 55%) auto',
        }}
      >
        {/* Empty state (before first message) */}
        {ai.messages.length === 0 && !ai.isProcessing && (
          <div className="flex flex-col items-center py-12">
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center mb-3.5">
              <span className="text-[32px] font-extrabold text-white">B</span>
            </div>
            <p className="text-[22px] font-bold text-[#5B21B6] mb-1.5">Bharat AI</p>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              Namaste! Main aapka personal assistant<br />hun. Product ya mechanic — boliye...
            </p>
          </div>
        )}

        {ai.messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble message={msg} isSpeaking={ai.isSpeaking} isLatest={msg === ai.messages[ai.messages.length - 1]} />
            {/* Product cards below AI message */}
            {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 pl-12 pr-3 mt-1 scrollbar-hide">
                {msg.products.map((product) => (
                  <ProductCardItem
                    key={product._id}
                    product={product}
                    onSelect={handleProductSelect}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Partial speech text */}
        {ai.isListening && ai.partialText && (
          <div className="flex justify-end">
            <div className="bg-[#1B3B6F]/60 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[74%] text-sm opacity-60">
              {ai.partialText}...
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {ai.isProcessing && (
          <div className="flex gap-2.5 items-start">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-extrabold text-white">B</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7C3AED] mb-0.5 ml-0.5">Bharat AI</p>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-[#F0ECFA]">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#7C3AED] opacity-30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-[#7C3AED] opacity-50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-[#7C3AED] opacity-70 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {ai.error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200 flex items-center gap-2">
            <span className="flex-1">{ai.error}</span>
            <button onClick={() => ai.startConversation()} className="text-[#7C3AED] font-semibold text-sm">Retry</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Booking Progress Bar */}
      {isBooking && (
        <div className="bg-[#7C3AED] text-white flex items-center justify-center gap-2.5 py-2.5 flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-semibold">{bookingStep}</span>
        </div>
      )}

      {/* Listening indicator bar */}
      {ai.isListening && (
        <div className="bg-[#F0ECFA] flex items-center justify-center gap-2 py-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
          <Mic className="h-4 w-4 text-[#7C3AED]" />
          <span className="text-[13px] text-[#7C3AED] font-medium">Sun raha hun... bolte rahiye</span>
        </div>
      )}

      {/* Post-booking navigation bar */}
      {bookingCompleted && (
        <div className="bg-white border-t border-[#E8E4F0] px-3.5 py-3 flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={navigateToTracking}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            {(ai.collectedData.flowType === 'product' || ai.collectedData.flowType === 'product_order')
              ? 'Order Track Karein'
              : 'Service Track Karein'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-3 rounded-xl bg-[#F3F0FF] text-[#7C3AED] font-semibold"
          >
            Home
          </button>
        </div>
      )}

      {/* Input Area (hidden after booking complete) */}
      {!bookingCompleted && (
        <div className="bg-white border-t border-[#E8E4F0] px-3 py-2.5 flex items-center gap-2.5 flex-shrink-0">
          {/* Text input with inline send */}
          <div className="flex-1 flex items-center bg-[#F8F7FC] rounded-3xl border border-[#E8E4F0] px-4 min-h-[46px]">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ai.isListening ? 'Sun raha hun...' : 'Type karein ya mic use karein...'}
              disabled={ai.isProcessing || isBooking}
              className="flex-1 bg-transparent text-[15px] text-gray-800 py-2.5 focus:outline-none disabled:opacity-50 placeholder:text-gray-400"
            />
            {inputText.trim() && (
              <button
                onClick={handleSend}
                disabled={ai.isProcessing || isBooking}
                className="h-[34px] w-[34px] rounded-full bg-[#7C3AED] flex items-center justify-center ml-1.5 disabled:opacity-50"
              >
                <Send className="h-[18px] w-[18px] text-white" />
              </button>
            )}
          </div>

          {/* Mic Button */}
          {ai.sttSupported && (
            <button
              onClick={handleMicPress}
              disabled={ai.isProcessing || isBooking}
              className={`h-[50px] w-[50px] rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0 disabled:opacity-50 ${
                ai.isListening
                  ? 'bg-red-500 shadow-red-200 animate-pulse'
                  : 'bg-[#7C3AED] shadow-purple-300'
              }`}
            >
              {ai.isListening ? (
                <div className="h-5 w-5 bg-white rounded-sm" /> // stop icon
              ) : (
                <Mic className="h-[22px] w-[22px] text-white" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────
function MessageBubble({ message, isSpeaking, isLatest }: {
  message: ChatMessage;
  isSpeaking: boolean;
  isLatest: boolean;
}) {
  const isUser = message.role === 'user';
  const showSpeakingDot = !isUser && isLatest && isSpeaking;

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'items-start'}`}>
      {!isUser && (
        <div className="flex flex-col items-center flex-shrink-0">
          <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center ${showSpeakingDot ? 'animate-bounce' : ''}`}
            style={showSpeakingDot ? { animationDuration: '800ms' } : undefined}
          >
            <span className="text-[17px] font-extrabold text-white">B</span>
          </div>
          {showSpeakingDot && (
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5" />
          )}
        </div>
      )}
      {isUser && (
        <div className="h-9 w-9 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      )}

      <div className="max-w-[74%]">
        {!isUser && (
          <p className="text-xs font-semibold text-[#7C3AED] mb-0.5 ml-0.5">Bharat AI</p>
        )}
        <div
          className={`px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-line ${
            isUser
              ? 'bg-[#1B3B6F] text-white rounded-2xl rounded-br-sm'
              : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-[#F0ECFA]'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

// ─── Clickable Product Card ────────────────────────────────────────────
function ProductCardItem({ product, onSelect }: { product: ProductCard; onSelect: (p: ProductCard) => void }) {
  const imageUrl = product.thumbnail?.url || product.image || '/placeholder-product.png';

  return (
    <button
      onClick={() => onSelect(product)}
      className="bg-white rounded-xl border border-[#F0ECFA] shadow-sm overflow-hidden min-w-[145px] max-w-[145px] flex-shrink-0 text-left hover:shadow-md hover:border-[#7C3AED]/30 transition-all active:scale-95"
    >
      <div className="h-[100px] bg-[#F3F0FF] flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.png';
          }}
        />
      </div>
      <div className="p-2.5">
        <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-[17px]">
          {product.name}
        </p>
        {product.brand?.name && (
          <p className="text-[11px] text-gray-500 mt-0.5">{product.brand.name}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-emerald-600">₹{product.price.selling}</span>
          {product.price.mrp > product.price.selling && (
            <span className="text-xs text-gray-400 line-through">₹{product.price.mrp}</span>
          )}
        </div>
      </div>
    </button>
  );
}
