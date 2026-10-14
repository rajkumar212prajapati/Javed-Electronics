import React from 'react';
import { useStore } from '../../context/StoreContext';
import { X, ShieldCheck, Truck, RotateCcw, HelpCircle, FileText, MapPin, Phone, Mail } from 'lucide-react';

export const PolicyModal: React.FC = () => {
  const { activeModal, setActiveModal, selectedPolicyType, settings } = useStore();

  if (activeModal !== 'policy' || !selectedPolicyType) return null;

  const renderContent = () => {
    switch (selectedPolicyType) {
      case 'about':
        return (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-slate-900">About Javed Electronics</h3>
            <p>
              Founded in 2008 in the heart of Hazratganj, Lucknow, <strong>Javed Electronics</strong> has grown from a neighborhood consumer electronics retail outlet into one of the city's most trusted destinations for authentic smartphones, audio systems, smart TVs, and home appliances.
            </p>
            <p>
              Unlike faceless national aggregator platforms, we believe in real local accountability. Every product on our shelves is sourced directly from brand authorized distributors with valid GST tax invoices and 100% manufacturer warranty.
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-blue-900">
              <span className="font-bold block">Our Core Pillars:</span>
              <p>• <strong>Same-Day 4-Hour Delivery:</strong> Dispatched from our own physical store in Lucknow by our dedicated delivery fleet.</p>
              <p>• <strong>WhatsApp Ordering:</strong> Frictionless, conversational shopping for local customers with live human assistance.</p>
              <p>• <strong>Physical In-Store Support:</strong> Walk into our Hazratganj shop any day of the week for unboxing, setup, or warranty help.</p>
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Local Shipping & Delivery Policy
            </h3>
            <p>
              Javed Electronics offers dedicated express local courier delivery across Lucknow city covering PIN codes 226001 through 226024.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Delivery Slots:</strong> Orders placed before 5:00 PM are dispatched same day in our 4:00 PM - 7:00 PM evening delivery window.</li>
              <li><strong>Free Delivery Threshold:</strong> Free courier delivery on all orders above ₹{settings.freeDeliveryThreshold}. Orders below this value incur a flat ₹{settings.deliveryFee} delivery charge.</li>
              <li><strong>Store Pickup:</strong> Always 100% FREE. Orders are packaged and kept ready at our Hazratganj store counter within 30 minutes.</li>
              <li><strong>Cash on Delivery (COD):</strong> Customers can inspect sealed manufacturer packaging before handing over cash to our delivery rider.</li>
            </ul>
          </div>
        );

      case 'returns':
        return (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Returns & 7-Day Replacement Policy
            </h3>
            <p>
              We want you to be completely satisfied with your electronics purchase. We provide a hassle-free <strong>7-Day Local Store Replacement Policy</strong> for manufacturing defects.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              <span className="font-bold block">Eligibility Criteria:</span>
              <p>1. Product must be in original condition with box, accessories, user manuals, and warranty cards intact.</p>
              <p>2. Original GST invoice copy must be presented.</p>
              <p>3. Physical drops, water ingress, or tampering voids replacement.</p>
            </div>
            <p>
              Upon verification, replacement is handed over immediately at our store or dispatched to your doorstep within 24 hours.
            </p>
          </div>
        );

      case 'warranty':
        return (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Brand Warranty & Service Assistance
            </h3>
            <p>
              All products sold at Javed Electronics carry official manufacturer warranty:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Smartphones:</strong> 1 Year Brand Warranty + 6 Months Accessories Warranty</li>
              <li><strong>Audio & Smartwatches:</strong> 1 Year Comprehensive Brand Replacement Warranty</li>
              <li><strong>Smart TVs:</strong> 1 Year Comprehensive + 2 Years Panel Warranty</li>
              <li><strong>Chargers & Cables:</strong> Up to 18-36 Months Manufacturer Warranty</li>
            </ul>
            <p className="mt-2">
              Our team assists customers with brand service center ticketing in Lucknow (Xiaomi, Samsung, boAt, Anker, JBL, Noise). Call our warranty helpline: {settings.warrantySupportPhone}.
            </p>
          </div>
        );

      default:
        return (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-base font-bold text-slate-900">Privacy & Terms of Service</h3>
            <p>
              Javed Electronics protects your personal data with standard industry practices. We only collect customer name, delivery address, and phone number necessary for processing and delivering your orders.
            </p>
            <p>
              We never store payment card credentials or netbanking passwords. All online payments are handled securely through verified payment gateways with SSL encryption.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {renderContent()}

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
