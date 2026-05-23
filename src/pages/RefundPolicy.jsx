import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const RefundPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. 7-Day Free Trial Policy",
      content: "All new subscriptions to our Savor Premium and Feast Ultimate plans include a 7-day free trial period. You can test all premium AI recipe matching, shared family kitchen configurations, and voice coaching features during this time. If you cancel your subscription in Account Settings at least 24 hours before the 7-day trial expires, no fees will be charged to your payment method."
    },
    {
      title: "2. Monthly Subscription Refunds",
      content: "Once a monthly billing cycle begins and a payment is successfully processed, subscription fees are generally non-refundable. We do not provide refunds or credits for partial billing periods or unused AI recipe credits. If you cancel mid-month, you will continue to have full access to your premium plan benefits until the end of your current monthly billing period."
    },
    {
      title: "3. Annual Subscription & Pre-order Refunds",
      content: "For users subscribed to annual plans, we offer a 7-day satisfaction refund guarantee. If you are unsatisfied with your annual subscription, you can submit a refund claim within 7 calendar days of your initial purchase date or renewal date to receive a full refund, minus any transaction fees incurred."
    },
    {
      title: "4. Accidental Duplicate Charges & Billing Errors",
      content: "If you believe you have been double-billed, charged in error, or billed after canceling your subscription, please submit a billing discrepancy report within 30 days of the transaction date. We will investigate the transaction and, if verified, process a full refund for the accidental charge immediately."
    },
    {
      title: "5. How to Request a Refund",
      content: "To submit a refund request, please email support@epicurean.ai or open a support request in the Help Center. In your request, please include: (a) Your registered account email address; (b) The transaction reference number or Razorpay Payment ID (available in your Billing History); (c) The date and amount of the charge; and (d) A brief explanation of your issue. Our billing support team responds within 24 hours."
    },
    {
      title: "6. Processing and Refund Timelines",
      content: "Approved refunds will be processed through our payment gateway (Razorpay) back to your original payment method (Credit/Debit Card, UPI, Net Banking, or Digital Wallet). Once initiated, it typically takes 5 to 7 business days for the funds to appear in your account, depending on your bank's processing times."
    },
    {
      title: "7. Account Status After Refund",
      content: "Upon the processing of a refund for a premium plan, your account will immediately be downgraded to the Taste (Free) plan. Any active family kitchen groups on a Feast plan will be deactivated, and features like the AI Voice Coach will be locked until an upgrade is purchased."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-container-margin">
        {/* Navigation Header */}
        <header className="mb-xl flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95 shadow-sm"
            aria-label="Go Back"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">Billing Operations</span>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display-lg text-display-lg text-on-surface leading-tight"
            >
              Refund Policy
            </motion.h1>
          </div>
        </header>

        {/* Intro Alert Box */}
        <div className="bg-surface-container-low border border-primary/10 rounded-3xl p-6 mb-lg flex gap-4 items-start shadow-sm">
          <span className="material-symbols-outlined text-primary !text-3xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>currency_exchange</span>
          <div>
            <h2 className="font-headline-sm text-on-surface mb-1">Billing Guarantee</h2>
            <p className="text-on-surface-variant font-body-md">
              Last updated: May 21, 2026. Review our rules regarding free trials, monthly billing cycles, billing errors, and payment processing timelines.
            </p>
          </div>
        </div>

        {/* Main Content Layout */}
        <main className="bg-surface-container rounded-[2.5rem] p-8 md:p-12 border border-outline-variant/30 shadow-sm space-y-8">
          {sections.map((sec, i) => (
            <motion.section 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-3"
            >
              <h3 className="font-headline-md text-headline-md text-primary">{sec.title}</h3>
              <p className="text-on-surface-variant font-body-lg leading-relaxed text-justify">{sec.content}</p>
              {i < sections.length - 1 && <div className="h-px bg-outline-variant/20 pt-4" />}
            </motion.section>
          ))}
        </main>

        <div className="mt-8 text-center text-label-sm text-on-surface-variant/40">
          Epicurean AI Billing Services • Delhi, India
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
