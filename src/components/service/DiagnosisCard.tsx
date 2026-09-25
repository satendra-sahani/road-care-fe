'use client';

import { useState, useEffect, useCallback } from 'react';
import { diagnosisAPI } from '@/services/api';
import { CheckCircle, XCircle, Wrench, Loader2, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosisCardProps {
  requestId: string;
  onStatusChange?: () => void;
}

// Shape of GET /user/service-requests/:id/diagnosis → data
interface DiagnosisPayload {
  status?: string; // request status: 'diagnosis' = awaiting approval
  requestId?: string;
  customerApproval?: { status?: string; rejectionReason?: string; approvedAt?: string };
  diagnosis?: {
    notes?: string;
    estimatedTime?: string;
    serviceWarranty?: string;
    diagnosedBy?: { user?: { fullName?: string } };
    costBreakdown?: {
      laborCost?: number;
      parts?: Array<{ name: string; quantity?: number; cost: number; warranty?: string }>;
      additionalCharges?: number;
      discount?: number;
      membershipDiscount?: number;
      freeServiceWaived?: number;
      emergencyCharges?: number;
      totalEstimate?: number;
      bookingFeeAdjusted?: number;
      onlinePaidAmount?: number;
      amountDue?: number;
    };
    revisions?: Array<{ revisedAt: string; revisedBy: string; reason?: string; previousTotal: number; newTotal: number; outcome: string }>;
  };
}

const inr = (n?: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function DiagnosisCard({ requestId, onStatusChange }: DiagnosisCardProps) {
  const [data, setData] = useState<DiagnosisPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const fetchDiagnosis = useCallback(async () => {
    try {
      const res = await diagnosisAPI.getDiagnosis(requestId);
      const payload = res.data?.data || res.data;
      setData(payload && payload.diagnosis ? payload : null);
    } catch {
      // No diagnosis yet — that's fine
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDiagnosis();
  }, [fetchDiagnosis]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await diagnosisAPI.approve(requestId);
      toast.success('Quote approved! Mechanic will proceed with the repair.');
      await fetchDiagnosis();
      onStatusChange?.();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to approve quote');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const res = await diagnosisAPI.reject(requestId, rejectReason || undefined);
      toast.success(res.data?.message || 'Quote rejected.');
      setShowRejectDialog(false);
      await fetchDiagnosis();
      onStatusChange?.();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to reject quote');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!data?.diagnosis) return null;

  const d = data.diagnosis;
  const cb = d.costBreakdown || {};
  const parts = cb.parts || [];
  const approval = data.customerApproval?.status || 'pending';
  const awaitingApproval = data.status === 'diagnosis';
  const pendingRevision = (d.revisions || []).find((r) => r.outcome === 'pending');
  const hasDeductions = (cb.bookingFeeAdjusted || 0) > 0 || (cb.onlinePaidAmount || 0) > 0;
  const mechanicName = d.diagnosedBy?.user?.fullName;

  const badge =
    approval === 'approved'
      ? { cls: 'bg-green-100 text-green-700', label: 'Approved' }
      : approval === 'rejected'
      ? { cls: 'bg-red-100 text-red-700', label: 'Rejected' }
      : { cls: 'bg-amber-100 text-amber-700', label: awaitingApproval ? 'Awaiting your approval' : 'Pending' };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="font-bold text-gray-900">Quotation</h3>
            {mechanicName && <p className="text-[11px] text-gray-500">by {mechanicName}</p>}
          </div>
          <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Revised after approval → tell the customer what changed */}
        {pendingRevision && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900">
            <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">The quotation was updated after your approval</p>
              <p className="text-xs mt-0.5">
                {inr(pendingRevision.previousTotal)} → <b>{inr(pendingRevision.newTotal)}</b>
                {pendingRevision.reason ? ` · ${pendingRevision.reason}` : ''}. Approve again to continue, or decline to keep the earlier approved quote.
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {d.notes && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Mechanic notes</p>
            <p>{d.notes}</p>
          </div>
        )}

        {/* Parts */}
        {parts.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Parts</p>
            <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
              {parts.map((part, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2.5 text-sm gap-3">
                  <span className="text-gray-700 min-w-0">
                    {part.name} <span className="text-gray-400">×{part.quantity || 1}</span>
                    {part.warranty && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                        <ShieldCheck className="h-3 w-3" /> {part.warranty} warranty
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-gray-900 shrink-0">{inr((part.cost || 0) * (part.quantity || 1))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Labour</span>
            <span className="font-medium">{inr(cb.laborCost)}</span>
          </div>
          {parts.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Parts</span>
              <span className="font-medium">{inr(parts.reduce((s, p) => s + (p.cost || 0) * (p.quantity || 1), 0))}</span>
            </div>
          )}
          {(cb.additionalCharges || 0) > 0 && (
            <div className="flex justify-between"><span className="text-gray-600">Additional charges</span><span className="font-medium">{inr(cb.additionalCharges)}</span></div>
          )}
          {(cb.emergencyCharges || 0) > 0 && (
            <div className="flex justify-between"><span className="text-gray-600">Emergency charges</span><span className="font-medium">{inr(cb.emergencyCharges)}</span></div>
          )}
          {(cb.discount || 0) > 0 && (
            <div className="flex justify-between text-green-700"><span>Discount</span><span className="font-medium">-{inr(cb.discount)}</span></div>
          )}
          {(cb.membershipDiscount || 0) > 0 && (
            <div className="flex justify-between text-green-700"><span>BM Care parts discount</span><span className="font-medium">-{inr(cb.membershipDiscount)}</span></div>
          )}
          {(cb.freeServiceWaived || 0) > 0 && (
            <div className="flex justify-between text-green-700"><span>BM Care free service</span><span className="font-medium">-{inr(cb.freeServiceWaived)}</span></div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total quote</span>
            <span className="text-[#FF6B35]">{inr(cb.totalEstimate)}</span>
          </div>
          {(cb.bookingFeeAdjusted || 0) > 0 && (
            <div className="flex justify-between text-xs text-green-700 bg-green-50 rounded px-2 py-1"><span>✓ Booking fee already paid online</span><span>-{inr(cb.bookingFeeAdjusted)}</span></div>
          )}
          {(cb.onlinePaidAmount || 0) > 0 && (
            <div className="flex justify-between text-xs text-blue-700 bg-blue-50 rounded px-2 py-1"><span>✓ Paid online</span><span>-{inr(cb.onlinePaidAmount)}</span></div>
          )}
          {hasDeductions && (
            <div className="flex justify-between text-base font-bold bg-amber-50 rounded px-2 py-2">
              <span className="text-amber-800">You pay</span>
              <span className="text-amber-700">{inr(cb.amountDue ?? cb.totalEstimate)}</span>
            </div>
          )}
        </div>

        {/* Guarantee + time */}
        {(d.serviceWarranty || d.estimatedTime) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {d.serviceWarranty && (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Service guarantee: {d.serviceWarranty}
              </span>
            )}
            {d.estimatedTime && (
              <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                <Clock className="h-3.5 w-3.5" /> Est. time: {d.estimatedTime}
              </span>
            )}
          </div>
        )}

        {data.customerApproval?.rejectionReason && approval === 'rejected' && (
          <p className="text-xs text-red-600">Rejected: {data.customerApproval.rejectionReason}</p>
        )}

        {/* Actions — only while the request is waiting on the customer */}
        {awaitingApproval && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve quote
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={rejecting}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              {pendingRevision ? 'Decline changes' : 'Reject'}
            </button>
          </div>
        )}

        {showRejectDialog && awaitingApproval && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
            <p className="text-sm font-semibold text-red-800">
              {pendingRevision ? 'Why are you declining the changes? (optional)' : 'Reason for rejection (optional)'}
            </p>
            {pendingRevision && (
              <p className="text-xs text-red-700">Work will continue with the earlier approved quote of {inr(pendingRevision.previousTotal)}.</p>
            )}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Price too high, want second opinion..."
              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {rejecting ? 'Please wait…' : pendingRevision ? 'Confirm decline' : 'Confirm reject'}
              </button>
              <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
