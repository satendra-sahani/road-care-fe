import { SEOHead } from '@/components/SEOHead'
import AIBookingPage from '@/components/service/AIBookingPage'

export default function AIBooking() {
  return (
    <>
      <SEOHead
        title="AI Voice Booking"
        description="Book mechanic services or order auto parts using our AI voice assistant. Speak in Hindi or English to get instant help."
        keywords="AI booking, voice assistant, auto parts, mechanic booking, Hindi voice booking"
      />
      <AIBookingPage />
    </>
  )
}
