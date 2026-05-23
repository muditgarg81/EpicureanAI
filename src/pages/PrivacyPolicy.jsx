import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us when creating an account, editing your profile, or using our culinary tools. This includes: (a) Personal details (name, email address, password hash, profile avatar); (b) Culinary preferences (allergens, dietary restrictions, favorite cuisines, kitchen skill levels); (c) Pantry Inventory and meal plans; and (d) Transient voice recordings processed during hands-free cooking mode (which are processed in real-time and not stored on our servers permanently)."
    },
    {
      title: "2. Payment Information",
      content: "All payment transactions are handled securely by third-party payment gateways, including Razorpay. We do not store credit card or bank details on our servers. Razorpay provides us with transactional confirmation tokens and billing metadata (such as name, card brand, and billing date) to activate your Savor or Feast plans."
    },
    {
      title: "3. How We Use Your Information",
      content: "We use the information we collect to: (a) Deliver customized AI recipe suggestions and pair flavors; (b) Maintain your pantry inventory and send push alerts for expiring items; (c) Synchronize the Kitchen Hub calendar and shopping lists across family accounts; (d) Process payments and subscription upgrades; (e) Track user mastery levels and award culinary badges; and (f) Send authentication codes and reset passwords."
    },
    {
      title: "4. Data Sharing & Third Parties",
      content: "We never sell, rent, or trade your personal data with third-party advertisers. We share information only with trusted processors necessary to deliver our services, including: (a) Database hosting (Supabase); (b) Payment processing (Razorpay); and (c) Support communications and transactional emails. All processors are bound by strict confidentiality and security agreements."
    },
    {
      title: "5. Cookies & Local Storage",
      content: "We use cookies and browser local storage to maintain your authentication session, save your language choice (defaulting to English), persist your active theme preference (dark/light mode), and optimize performance. You can disable cookies in your browser settings, though some app features may stop functioning correctly."
    },
    {
      title: "6. Data Security",
      content: "We implement industry-standard encryption protocols (SSL/TLS) for all data in transit and encrypt passwords and database columns at rest. While we strive to protect your personal data, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security."
    },
    {
      title: "7. Your Rights & Data Deletion",
      content: "You have the right to access, export, modify, or delete your personal details. You can update your account preferences at any time under Settings. To delete your account and wipe all corresponding recipes, flavor profiles, and family associations, you can use the \"Delete Account\" feature in Account Settings > Security. This operation is permanent and irreversible."
    },
    {
      title: "8. Updates to this Privacy Policy",
      content: "We may update this Privacy Policy from time to time to reflect changes in our AI technologies or privacy regulations. We will notify you of any material changes by updating the \"Last Updated\" date at the top of this policy and posting an in-app notice."
    },
    {
      title: "9. Contact our Privacy Officer",
      content: "For questions about this policy, data export requests, or inquiries regarding your rights, please reach out to our privacy compliance officer at privacy@epicurean.ai."
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
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">Data Protection</span>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display-lg text-display-lg text-on-surface leading-tight"
            >
              Privacy Policy
            </motion.h1>
          </div>
        </header>

        {/* Intro Alert Box */}
        <div className="bg-surface-container-low border border-primary/10 rounded-3xl p-6 mb-lg flex gap-4 items-start shadow-sm">
          <span className="material-symbols-outlined text-primary !text-3xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <div>
            <h2 className="font-headline-sm text-on-surface mb-1">Your Privacy is Paramount</h2>
            <p className="text-on-surface-variant font-body-md">
              Last updated: May 21, 2026. This policy describes how we protect your personal account credentials, dietary choices, and transactional data in compliance with general data protection regulations.
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
          Epicurean AI Data Security Operations • Delhi, India
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
