import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Leaf VN Studio',
  description: 'Privacy Policy and Data Protection guidelines for Leaf VN Studio visual novel engine.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#07040B] text-gray-200 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#D17BF8] selection:text-black relative overflow-hidden">
      {/* Ambient background glow matching engine aesthetic */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-8 bg-[#0F071D]/90 border border-purple-500/25 rounded-2xl p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        
        {/* Header */}
        <div className="border-b border-purple-500/20 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/assets/logo/LeafVN.png" alt="Leaf VN" className="w-10 h-10 object-contain rounded-xl shadow-md" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D17BF8] tracking-tight">
                Leaf VN Studio
              </h1>
            </div>
            <p className="text-xs uppercase tracking-wider text-purple-300/70 mt-1.5 font-mono">
              Privacy Policy &amp; User Data Protection
            </p>
          </div>
          <Link
            href="/"
            className="self-start sm:self-auto px-4 py-2 bg-purple-900/40 hover:bg-[#D17BF8] text-purple-100 hover:text-[#07040B] font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-purple-500/40 shadow-sm"
          >
            ← Return to Home
          </Link>
        </div>

        {/* Notice of Date */}
        <div className="text-xs text-purple-400/80 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Last Updated: October 31, 2026 • Effective Date: October 31, 2026</span>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm text-gray-200 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>1. Overview</span>
            </h2>
            <p className="text-gray-300">
              Welcome to <strong>Leaf VN Studio</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Engine&quot;). We respect your privacy and are committed to protecting any personal data you share with us. This Privacy Policy explains how our web application collects, uses, stores, and protects your information when you access or interact with Leaf VN Studio, including sign-in via third-party providers such as <strong>Facebook Login (Meta Platforms, Inc.)</strong>, <strong>Google Sign-In</strong>, and <strong>GitHub</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>2. Information We Collect</span>
            </h2>
            <p className="text-gray-300">When you use Leaf VN Studio, we may collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
              <li>
                <strong className="text-purple-200">Authentication &amp; Profile Data:</strong> When signing in with Facebook, Google, or GitHub, we receive your basic public profile information (such as your display name, profile avatar, and verified email address) provided by the respective OAuth identity provider.
              </li>
              <li>
                <strong className="text-purple-200">Project &amp; Story Data:</strong> Visual novel scenarios, scripts, dialogue lines, assets (images, audio clips), variables, and configuration metadata created or imported by you.
              </li>
              <li>
                <strong className="text-purple-200">Technical &amp; Device Information:</strong> Standard browser session storage, IndexedDB caches, and language preferences necessary to run the engine locally on your device.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>3. How We Use Your Information</span>
            </h2>
            <p className="text-gray-300">We use the collected information exclusively to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
              <li>Authenticate your identity and provide secure access to your visual novel projects.</li>
              <li>Save and sync your projects with cloud storage (Firebase / Google Drive) upon your request.</li>
              <li>Maintain your personal workspace preferences, UI themes, and audio volume configurations.</li>
              <li>Provide customer support, bug fixes, and security patches.</li>
            </ul>
            <p className="text-xs bg-purple-950/30 p-3 rounded-lg border border-purple-500/30 text-purple-200 font-medium mt-2">
              We <strong>do NOT</strong> sell, rent, monetize, or share your personal information or visual novel creations with third-party advertisers or data brokers under any circumstances.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>4. Third-Party Services &amp; Authentication</span>
            </h2>
            <p className="text-gray-300">
              Our application integrates with trusted third-party service providers for authentication and hosting:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
              <li>
                <strong className="text-purple-200">Meta Platforms, Inc. (Facebook Login):</strong> Used solely to verify your account identity. You can manage or revoke access anytime from your Facebook Account Settings.
              </li>
              <li>
                <strong className="text-purple-200">Google Firebase &amp; Google Cloud:</strong> Used for secure user authentication (Firebase Auth) and database hosting.
              </li>
              <li>
                <strong className="text-purple-200">GitHub, Inc.:</strong> Used as an optional developer sign-in method.
              </li>
            </ul>
          </section>

          {/* Section 5 - USER DATA DELETION (CRITICAL FOR META) */}
          <section id="data-deletion" className="space-y-3 p-5 bg-purple-950/25 border border-purple-500/40 rounded-xl">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>5. User Data Deletion Instructions (Facebook &amp; OAuth Data)</span>
            </h2>
            <p className="text-gray-300">
              In compliance with Meta Platform Terms and General Data Protection Regulations (GDPR/CCPA), you have the right to request the complete deletion of all personal data associated with your account.
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-purple-200">To remove Leaf VN Studio from your Facebook account:</p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-gray-300">
                <li>Go to your Facebook Profile &gt; <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
                <li>In the left menu, select <strong>Apps and Websites</strong>.</li>
                <li>Find <strong>Leaf VN Studio</strong> and click <strong>Remove</strong>.</li>
                <li>Confirm deletion.</li>
              </ol>
              <p className="font-semibold text-purple-200 pt-2">To request full database deletion of your Leaf VN account and cloud saves:</p>
              <p className="text-gray-300">
                You can delete your cloud-stored projects directly from the in-app Project Manager by clicking the &quot;Delete&quot; icon, or send an email request to our privacy team at{' '}
                <a href="mailto:leffi.app.help@gmail.com" className="text-[#D17BF8] underline font-mono">
                  leffi.app.help@gmail.com
                </a>{' '}
                with the subject &quot;Data Deletion Request&quot;. Your account and associated cloud records will be permanently purged within 30 days.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>6. Data Storage &amp; Security</span>
            </h2>
            <p className="text-gray-300">
              We implement industry-standard encryption protocols (HTTPS/TLS) for data in transit and secure Firebase authentication standards. Project files stored locally in your browser (IndexedDB) never leave your device unless you explicitly trigger an export or cloud backup.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#D17BF8] flex items-center gap-2">
              <span>7. Contact Us</span>
            </h2>
            <p className="text-gray-300">
              If you have any questions, feedback, or concerns regarding this Privacy Policy or your personal data, please contact us at:
            </p>
            <div className="p-3.5 bg-purple-950/20 border border-purple-500/25 rounded-lg font-mono text-xs text-purple-200/90 space-y-1">
              <div><strong>Project:</strong> Leaf VN Studio</div>
              <div><strong>Email:</strong> leffi.app.help@gmail.com</div>
              <div><strong>Website:</strong> https://leafvn.vercel.app</div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-purple-500/20 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-purple-300/60 gap-2">
          <span>&copy; {new Date().getFullYear()} Leaf VN Studio. All rights reserved.</span>
          <Link href="/" className="hover:text-[#D17BF8] transition-colors">
            Return to Studio Home
          </Link>
        </div>

      </div>
    </div>
  );
}
