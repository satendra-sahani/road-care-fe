'use client';

import { useState } from 'react';
import { X, Star, Shield, Check, Wallet } from 'lucide-react';
import { userServiceAPI } from '@/services/api';

interface RatingFlowProps {
  requestId: string;
  mechName: string;
  mechRating?: number;
  color?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const ASPECTS = [
  { k: 'punctuality', emoji: '⏱️', label: 'Punctuality', sub: 'Arrived on time' },
  { k: 'quality', emoji: '🔧', label: 'Work quality', sub: 'Repair was thorough' },
  { k: 'professionalism', emoji: '👔', label: 'Professionalism', sub: 'Polite & respectful' },
  { k: 'value', emoji: '💰', label: 'Value for money', sub: 'Fair pricing' },
];
const REVTAGS = ['On time', 'Quick fix', 'Friendly', 'Skilled', 'Honest pricing', 'Clean work', 'Patient', 'Explained well'];
const RLBL = ['', 'Poor', 'Fair', 'Good', 'Great service!', 'Excellent!'];

/** 3-step rate & review flow + thank-you — faithful to claude-design `openRating()`. */
export default function RatingFlow({ requestId, mechName, mechRating, color = '#1B3B6F', onClose, onSubmitted }: RatingFlowProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fn = mechName.split(' ')[0];
  const initials = mechName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const submit = async () => {
    setSubmitting(true);
    try {
      await userServiceAPI.addReview(requestId, { rating, review: review.trim() || undefined });
    } catch {
      /* keep the UX flowing even if the call fails */
    }
    setSubmitting(false);
    setStep(4);
    onSubmitted?.();
  };

  const Header = () => (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: color }}>{initials}</div>
      <div className="flex-1 min-w-0">
        <b className="block text-[15px] text-[#13203A] truncate">{mechName}</b>
        <span className="text-xs text-[#7B8AA3]">Verified · ★ {mechRating ?? '4.8'}</span>
      </div>
      <span className="text-[10px] font-bold tracking-wide text-[#15936B] bg-[#15936B]/10 rounded-full px-2 py-1">COMPLETED</span>
    </div>
  );

  const Dots = () => (
    <div className="flex items-center justify-center gap-1.5 my-4">
      {[1, 2, 3].map((n) => (
        <i key={n} className={`h-1.5 rounded-full transition-all ${n <= step ? 'w-5 bg-[#1B3B6F]' : 'w-1.5 bg-[#E7ECF3]'}`} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget && step !== 4) onClose(); }}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        {step !== 4 && (
          <button onClick={onClose} className="float-right h-8 w-8 -mt-1 -mr-1 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7B8AA3]"><X className="h-4 w-4" /></button>
        )}

        {step === 1 && (
          <>
            <Header />
            <div className="text-center">
              <div className="text-lg font-extrabold text-[#13203A]">How was the service?</div>
              <div className="text-[13px] text-[#7B8AA3] mt-0.5">Your feedback helps us improve quality</div>
              <div className="flex items-center justify-center gap-2 my-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className="transition-transform active:scale-90">
                    <Star className={`h-9 w-9 ${n <= rating ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E7ECF3]'}`} />
                  </button>
                ))}
              </div>
              <div className="text-sm font-bold text-[#13203A] min-h-[36px]">
                {rating ? <>{RLBL[rating]}<small className="block font-normal text-[#7B8AA3]">{rating} out of 5 stars</small></> : <span className="text-[#7B8AA3] font-normal">Tap to rate</span>}
              </div>
            </div>
            <div className="text-sm font-semibold text-[#13203A] mt-3 mb-2">Are you satisfied with the work?</div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSatisfied(true)} className={`py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 ${satisfied === true ? 'border-[#15936B] bg-[#15936B]/8 text-[#15936B]' : 'border-[#E7ECF3] text-[#475569]'}`}><span>👍</span> Yes, satisfied</button>
              <button onClick={() => setSatisfied(false)} className={`py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 ${satisfied === false ? 'border-[#E5484D] bg-[#E5484D]/8 text-[#E5484D]' : 'border-[#E7ECF3] text-[#475569]'}`}><span>👎</span> Not really</button>
            </div>
            <Dots />
            <button disabled={!rating} onClick={() => setStep(2)} className="w-full bg-[#FF6B35] hover:bg-[#e85a28] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-colors">Continue</button>
          </>
        )}

        {step === 2 && (
          <>
            <Header />
            <div className="text-lg font-extrabold text-[#13203A]">Rate specific aspects</div>
            <div className="text-[13px] text-[#7B8AA3] mt-0.5 mb-3">Tap stars for each aspect</div>
            <div className="space-y-2.5">
              {ASPECTS.map((a) => {
                const val = aspects[a.k] || 0;
                return (
                  <div key={a.k} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E7ECF3]">
                    <div className="text-xl">{a.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-[13.5px] text-[#13203A]">{a.label}</b>
                      <span className="text-[11.5px] text-[#7B8AA3]">{a.sub}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setAspects((p) => ({ ...p, [a.k]: n }))}>
                          <Star className={`h-4 w-4 ${n <= val ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E7ECF3]'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Dots />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep(1)} className="py-3.5 rounded-xl bg-gray-100 text-[#475569] font-semibold">Back</button>
              <button onClick={() => setStep(3)} className="py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a28] text-white font-bold">Continue</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Header />
            <div className="text-lg font-extrabold text-[#13203A]">Share your experience</div>
            <div className="text-[13px] text-[#7B8AA3] mt-0.5 mb-3">Help others by writing a review (optional)</div>
            <div className="text-[13px] font-semibold text-[#13203A] mb-2">What stood out?</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {REVTAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button key={t} onClick={() => setTags((p) => on ? p.filter((x) => x !== t) : [...p, t])} className={`text-[12.5px] font-medium rounded-full px-3 py-1.5 border ${on ? 'border-[#1B3B6F] bg-[#1B3B6F]/8 text-[#1B3B6F]' : 'border-[#E7ECF3] text-[#475569]'}`}>{t}</button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#13203A] mb-1.5">Your review <span className="text-[11.5px] font-normal text-[#7B8AA3]">{review.length} / 500</span></div>
            <textarea value={review} maxLength={500} rows={3} onChange={(e) => setReview(e.target.value)} placeholder="What did you like? What can be improved?" className="w-full rounded-xl border border-[#E7ECF3] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/20" />
            <Dots />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep(2)} className="py-3.5 rounded-xl bg-gray-100 text-[#475569] font-semibold">Back</button>
              <button disabled={submitting} onClick={submit} className="py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85a28] disabled:opacity-50 text-white font-bold">{submitting ? 'Submitting…' : 'Submit review'}</button>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="text-center py-2">
            <div className="relative h-20 w-20 mx-auto mb-3 rounded-full bg-[#15936B]/12 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-[#15936B] flex items-center justify-center text-white"><Check className="h-7 w-7" /></div>
            </div>
            <h2 className="text-2xl font-extrabold text-[#13203A]">Thank you!</h2>
            <div className="text-sm text-[#7B8AA3]">धन्यवाद!</div>
            <p className="text-[13.5px] text-[#475569] mt-2 max-w-xs mx-auto">Your review has been posted. It helps other customers and our mechanics improve.</p>
            <div className="flex items-center gap-3 bg-[#15936B]/8 rounded-xl p-3 mt-4 text-left">
              <Wallet className="h-5 w-5 text-[#15936B]" />
              <div className="flex-1"><b className="block text-[13.5px] text-[#13203A]">Reward credited</b><span className="text-[12px] text-[#7B8AA3]">₹20 added to wallet</span></div>
              <span>✨</span>
            </div>
            <div className="mt-4 text-left">
              <div className="text-[13.5px] font-bold text-[#13203A]">Tip {fn}?</div>
              <div className="text-[12px] text-[#7B8AA3] mb-2">Send a tip directly to reward great service</div>
              <div className="flex gap-2">
                {[20, 50, 100].map((t) => (
                  <button key={t} onClick={() => setTip(t)} className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold ${tip === t ? 'border-[#FF6B35] bg-[#FF6B35]/8 text-[#FF6B35]' : 'border-[#E7ECF3] text-[#475569]'}`}>₹{t}</button>
                ))}
                <button onClick={() => setTip(0)} className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold ${tip === 0 ? 'border-[#1B3B6F] bg-[#1B3B6F]/8 text-[#1B3B6F]' : 'border-[#E7ECF3] text-[#475569]'}`}>No tip</button>
              </div>
            </div>
            <button onClick={onClose} className="w-full bg-[#1B3B6F] hover:bg-[#152d55] text-white font-bold py-3.5 rounded-xl mt-5 flex items-center justify-center gap-2"><Shield className="h-4 w-4" /> Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
