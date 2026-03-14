'use client';

import { useState, useEffect } from 'react';
import { diagnosisAPI } from '@/services/api';
import { CheckCircle, XCircle, Wrench, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosisCardProps {
  requestId: string;
  onStatusChange?: () => void;
}

interface DiagnosisData {
  foundIssues?: string[];
  partsRequired?: Array<{ name: string; quantity: number; cost: number }>;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  notes?: string;
  status?: string;
}

export default function DiagnosisCard({ requestId, onStatusChange }: DiagnosisCardProps) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    fetchDiagnosis();
  }, [requestId]);

  const fetchDiagnosis = async () => {
    try {
      const res = await diagnosisAPI.getDiagnosis(requestId);
      const data = res.data?.data || res.data;
      setDiagnosis(data);
    } catch {
      // No diagnosis yet — that's fine
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await diagnosisAPI.approve(requestId);
      toast.success('Quote approved! Mechanic will proceed with the repair.');
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
      await diagnosisAPI.reject(requestId, rejectReason || undefined);
      toast.success('Quote rejected.');
      setShowRejectDialog(false);
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

  if (!diagnosis) return null;

  const isApprovedOrRejected =
    diagnosis.status === 'approved' || diagnosis.status === 'rejected';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-600" />
          <h3 className="font-bold text-gray-900">Mechanic Diagnosis</h3>
          {diagnosis.status && (
            <span
              className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${
                diagnosis.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : diagnosis.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {diagnosis.status.charAt(0).toUpperCase() + diagnosis.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Found Issues */}
        {diagnosis.foundIssues && diagnosis.foundIssues.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Issues Found</p>
            <div className="flex flex-wrap gap-2">
              {diagnosis.foundIssues.map((issue, i) => (
                <span
                  key={i}
                  className="bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200"
                >
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  {issue}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Parts Required */}
        {diagnosis.partsRequired && diagnosis.partsRequired.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Parts Required</p>
            <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
              {diagnosis.partsRequired.map((part, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2.5 text-sm">
                  <span className="text-gray-700">
                    {part.name} <span className="text-gray-400">×{part.quantity}</span>
                  </span>
                  <span className="font-semibold text-gray-900">₹{part.cost}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          {diagnosis.laborCost !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Labor Cost</span>
              <span className="font-medium">₹{diagnosis.laborCost}</span>
            </div>
          )}
          {diagnosis.partsCost !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Parts Cost</span>
              <span className="font-medium">₹{diagnosis.partsCost}</span>
            </div>
          )}
          {diagnosis.totalCost !== undefined && (
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total Quote</span>
              <span className="text-[#FF6B35]">₹{diagnosis.totalCost}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {diagnosis.notes && (
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Mechanic Notes:</p>
            <p>{diagnosis.notes}</p>
          </div>
        )}

        {/* Actions */}
        {!isApprovedOrRejected && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {approving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve Quote
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={rejecting}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
            <p className="text-sm font-semibold text-red-800">
              Reason for rejection (optional)
            </p>
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
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
