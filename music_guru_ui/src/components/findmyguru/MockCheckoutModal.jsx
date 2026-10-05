import React, { useState, useEffect } from 'react';
import { guruService } from '../../services/guruService';
import { useGuru } from '../../context/GuruContext';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Lock,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const MockCheckoutModal = ({ isOpen, onClose, plan, academy, onSuccess }) => {
  const { updateAcademySubscription } = useGuru();
  const [step, setStep] = useState('SUMMARY'); // 'SUMMARY' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isOpen && plan) {
      setStep('SUMMARY');
      setErrorMessage('');
      setIsInitializing(true);

      const targetAcadId = academy ? academy.id : null;
      guruService
        .initiateCheckout(plan.id, targetAcadId)
        .then((res) => {
          if (res && res.checkoutSession) {
            setCheckoutSession(res.checkoutSession);
            setTransactionRef(res.checkoutSession.transactionRef);
          } else {
            // Local fallback session
            const fallbackRef = `MOCK-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            setTransactionRef(fallbackRef);
            setCheckoutSession({
              transactionRef: fallbackRef,
              plan: {
                id: plan.id,
                name: plan.name,
                description: plan.description || '',
                price: Number(plan.price || 0),
                durationMonths: Number(plan.durationMonths || 12)
              },
              amount: Number(plan.price || 0),
              billingCycle: `${plan.durationMonths || 12} Months`,
              academyId: targetAcadId
            });
          }
        })
        .catch((err) => {
          console.warn('Backend checkout initiation failed, using fallback:', err);
          const fallbackRef = `MOCK-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
          setTransactionRef(fallbackRef);
          setCheckoutSession({
            transactionRef: fallbackRef,
            plan: {
              id: plan.id,
              name: plan.name,
              description: plan.description || '',
              price: Number(plan.price || 0),
              durationMonths: Number(plan.durationMonths || 12)
            },
            amount: Number(plan.price || 0),
            billingCycle: `${plan.durationMonths || 12} Months`,
            academyId: targetAcadId
          });
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [isOpen, plan, academy]);

  if (!isOpen || !plan) return null;

  const isFreePlan = Number(plan?.price || 0) === 0 || String(plan?.name || '').toLowerCase().includes('free');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setIsInitializing(true);
    setErrorMessage('');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setIsInitializing(false);
      setStep('FAILED');
      setErrorMessage('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const targetAcadId = academy ? academy.id : null;
    const orderRes = await guruService.createRazorpayOrder(plan.id, targetAcadId);

    if (!orderRes || !orderRes.orderId) {
      setIsInitializing(false);
      setStep('FAILED');
      setErrorMessage(orderRes?.message || 'Failed to create Razorpay payment order on server.');
      return;
    }

    const options = {
      key: orderRes.keyId || 'rzp_test_YOUR_KEY_ID',
      amount: orderRes.amount,
      currency: orderRes.currency || 'INR',
      name: 'FindMyMusicGurukul',
      description: `Subscription Upgrade: ${plan.name}`,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&q=80',
      order_id: orderRes.orderId,
      handler: async (response) => {
        setStep('PROCESSING');
        try {
          const verifyRes = await guruService.verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: plan.id,
            academyId: targetAcadId,
            internalOrderId: orderRes.internalOrderId
          });

          if (verifyRes && (verifyRes.success || verifyRes.paymentStatus === 'SUCCESS')) {
            setStep('SUCCESS');
            setTransactionRef(response.razorpay_payment_id || orderRes.orderId);
            if (targetAcadId) {
              await updateAcademySubscription(targetAcadId, plan.id);
            }
            if (onSuccess) {
              onSuccess(response.razorpay_payment_id || orderRes.orderId, plan);
            }
          } else {
            setStep('FAILED');
            setErrorMessage(verifyRes.message || 'Razorpay payment signature verification failed.');
          }
        } catch (err) {
          setStep('FAILED');
          setErrorMessage(err.message || 'Error processing payment verification.');
        }
      },
      prefill: {
        name: academy ? academy.teacherName || academy.academyName : '',
        email: academy ? academy.email : '',
        contact: academy ? academy.phone : ''
      },
      notes: {
        planId: plan.id,
        academyId: targetAcadId
      },
      theme: {
        color: '#d97706'
      },
      modal: {
        ondismiss: () => {
          setIsInitializing(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setIsInitializing(false);
        setStep('FAILED');
        setErrorMessage(resp.error?.description || 'Razorpay payment was declined or failed.');
      });
      rzp.open();
      setIsInitializing(false);
    } catch (e) {
      setIsInitializing(false);
      setStep('FAILED');
      setErrorMessage(e.message || 'Failed to launch Razorpay checkout modal.');
    }
  };

  const handleSimulatePayment = async (status, failureReason = '') => {
    setStep('PROCESSING');
    setErrorMessage('');

    const targetAcadId = academy ? academy.id : null;
    const currentTxnRef = transactionRef || `MOCK-TXN-${Date.now()}`;

    setTimeout(async () => {
      try {
        const response = await guruService.confirmCheckout({
          transactionRef: currentTxnRef,
          planId: plan.id,
          academyId: targetAcadId,
          status,
          failureReason
        });

        if (status === 'SUCCESS' && (response.success || response.paymentStatus === 'SUCCESS')) {
          setStep('SUCCESS');
          if (targetAcadId) {
            await updateAcademySubscription(targetAcadId, plan.id);
          }
          if (onSuccess) {
            onSuccess(currentTxnRef, plan);
          }
        } else if (status === 'FAILED') {
          setStep('FAILED');
          setErrorMessage(failureReason || response.message || 'Simulated payment failed (Test Card Declined).');
        } else {
          if (status === 'SUCCESS') {
            setStep('SUCCESS');
            if (targetAcadId) {
              await updateAcademySubscription(targetAcadId, plan.id);
            }
            if (onSuccess) onSuccess(currentTxnRef, plan);
          } else {
            setStep('FAILED');
            setErrorMessage(failureReason || 'Payment request failed.');
          }
        }
      } catch (err) {
        if (status === 'SUCCESS') {
          setStep('SUCCESS');
          if (targetAcadId) {
            await updateAcademySubscription(targetAcadId, plan.id);
          }
          if (onSuccess) onSuccess(currentTxnRef, plan);
        } else {
          setStep('FAILED');
          setErrorMessage(failureReason || 'Simulated payment processing error.');
        }
      }
    }, 1200);
  };

  const handleCancel = () => {
    guruService.confirmCheckout({
      transactionRef: transactionRef || `MOCK-TXN-${Date.now()}`,
      planId: plan.id,
      academyId: academy ? academy.id : null,
      status: 'CANCELLED'
    }).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-gray-100 my-8 animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Secure Checkout</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Encrypted & Secure Payment Processing</p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step 1: Order Summary & Checkout Actions */}
        {step === 'SUMMARY' && (
          <div className="space-y-6">
            {/* Plan Card Summary */}
            <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-lg space-y-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest block">Selected Subscription Plan</span>
                  <h4 className="text-2xl font-black text-white mt-0.5">{plan.name}</h4>
                </div>
                {isFreePlan ? (
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">Lifetime Free</span>
                    <span className="text-[10px] text-emerald-300 block font-semibold">₹0 Forever</span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400">₹{plan.price}</span>
                    <span className="text-[10px] text-slate-300 block font-semibold">/ {plan.durationMonths || 12} Months</span>
                  </div>
                )}
              </div>

              {plan.description && (
                <p className="text-xs text-slate-300 border-t border-slate-700/80 pt-3">{plan.description}</p>
              )}

              <div className="pt-2 flex items-center text-[11px] text-slate-400 border-t border-slate-700/60">
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {isFreePlan ? 'Billing Period: Lifetime Free (Never Expires)' : 'Billing Period: 1 Year (12 Months)'}
                </span>
              </div>
            </div>

            {/* Target Academy Info */}
            {academy && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 font-semibold block text-[10px] uppercase tracking-wider">Activating Subscription For:</span>
                  <span className="font-bold text-gray-900 text-sm">{academy.academyName}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {academy.city}
                </span>
              </div>
            )}

            {/* Payment Action Buttons Panel */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {isFreePlan ? (
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  disabled={isInitializing}
                  className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 text-base border border-emerald-400/30"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Activate Free Plan</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={isInitializing}
                  className="w-full p-4 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 active:scale-98 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 text-base border border-indigo-500/30"
                >
                  <Lock className="w-5 h-5 text-indigo-200" />
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              )}

              {/* Trust Badges */}
              <div className="flex items-center justify-center space-x-6 text-gray-400 py-2">
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">All Cards Accepted</span>
                </div>
              </div>

              <div className="pt-2 pb-2 text-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-700 font-semibold text-xs transition-colors underline decoration-gray-300 hover:decoration-gray-500 underline-offset-4"
                >
                  Cancel and return
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Processing State */}
        {step === 'PROCESSING' && (
          <div className="py-12 text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-gray-900 text-base">Processing Test Payment...</h4>
              <p className="text-xs text-gray-500">Connecting to mock payment gateway & validating transaction reference...</p>
            </div>
            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[11px] font-mono text-gray-600 border border-slate-200">
              {transactionRef}
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Payment Successful
              </span>
              <h4 className="font-black text-2xl text-gray-900 pt-1">Subscription Activated!</h4>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                <strong>{plan.name}</strong> is now active for <strong>{academy ? academy.academyName : 'your account'}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-gray-900">{transactionRef}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">{isFreePlan ? '₹0 (Lifetime Free)' : `₹${plan.price}`}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-bold text-emerald-600">{isFreePlan ? 'FREE ACTIVATION' : 'PAID (SUCCESS)'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Validity:</span>
                <span className="font-bold text-purple-700">{isFreePlan ? 'Lifetime Free' : '12 Months (Active)'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs transition-all active:scale-95"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

        {/* Step 4: Failure Screen */}
        {step === 'FAILED' && (
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 bg-rose-100 border-2 border-rose-300 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Simulated Payment Failed
              </span>
              <h4 className="font-black text-2xl text-gray-900 pt-1">Checkout Declined</h4>
              <p className="text-xs text-rose-700 font-semibold max-w-sm mx-auto bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {errorMessage || 'Simulated card decline / Insufficient test funds.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-gray-900">{transactionRef}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-500">Attempted Plan:</span>
                <span className="font-bold text-gray-800">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-bold text-rose-600">FAILED (MOCK)</span>
              </div>
            </div>

            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setStep('SUMMARY')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md text-xs transition-all active:scale-95"
              >
                Retry Payment
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
              >
                Close Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockCheckoutModal;
