import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Leaf VN Studio',
  description: 'Privacy Policy and Data Protection guidelines for Leaf VN Studio visual novel engine.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0503] text-gray-200 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#D17BF8] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#140A06]/90 border border-[#3D1E0F] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="border-b border-[#3D1E0F] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/assets/logo/LeafVN.png" alt="Leaf VN" className="w-10 h-10 object-contain rounded-xl" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D17BF8] tracking-tight">
                Leaf VN Studio
              </h1>
            </div>
            <p className="text-xs uppercase tracking-wider text-[#A29A95] mt-1 font-mono">
              Privacy Policy & User Data Protection
            </p>
          </div>
          <Link
            href="/"
            className="self-start sm:self-auto px-4 py-2 bg-[#2D160B] hover:bg-[#D17BF8] text-[#F3EFEA] hover:text-[#0A0503] font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-[#522915]"
          >
            ← Return to Home
          </Link>
        </div>

        {/* Notice of Date */}
        <div className="text-xs text-[#A29A95] font-mono">
          Last Updated: October 31, 2026 • Effective Date: October 31, 2026
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm text-[#F3EFEA]/90 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#E59A5A] flex items-center gap-2">
              <span>1. Overview</span>
            </h2>
            <p>
              Welcome to <strong>Leaf VN Studio</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Engine&quot;). We respect your privacy and are committed to protecting any personal data you share with us. This Privacy Policy explains how our web application collects, uses, stores, and protects your information when you access or interact with Leaf VN Studio, including sign-in via third-party providers such as <strong>Facebook Login (Meta Platforms, Inc.)</strong>, <strong>Google Sign-In</strong>, and <strong>GitHub</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#E59A5A] flex items-center gap-2">
              <span>2. Information We Collect</span>
            </h2>
            <p>When you use Leaf VN Studio, we may collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-[#A29A95]">
              <li>
                <strong className="text-[#F3EFEA]">Authentication & Profile Data:</strong> When signing in with Facebook, Google, or GitHub, we receive your basic public profile information (such as your display name, profile avatar, and verified email address) provided by the respective OAuth identity provider.
              </li>
              <li>
                <strong className="text-[#F3EFEA]">Project & Story Data:</strong> Visual novel scenarios, scripts, dialogue lines, assets (images, audio clips), variables, and configuration metadata created or imported by you.
              </li>
              <li>
                <strong className="text-[#F3EFEA]">Technical & Device Information:</strong> Standard browser session storage, IndexedDB caches, and language preferences necessary to run the engine locally on your device.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#E59A5A] flex items-center gap-2">
              <span>3. How We Use Your Information</span>
            </h2>
            <p>We use the collected information exclusively to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-[#A29A95]">
              <li>Authenticate your identity and provide secure access to your visual novel projects.</li>
              <li>Save and sync your projects with cloud storage (Firebase / Google Drive) upon your request.</li>
              <li>Maintain your personal workspace preferences, UI themes, and audio volume configurations.</li>
              <li>Provide customer support, bug fixes, and security patches.</li>
            </ul>
            <p className="text-xs bg-[#2D160B]/60 p-3 rounded-lg border border-[#522915] text-[#D17BF8]">
              We <strong>do NOT</strong> sell, rent, monetize, or share your personal information or visual novel creations with third-party advertisers or data brokers under any circumstances.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#E59A5A] flex items-center gap-2">
              <span>4. Third-Party Services & Authentication</span>
            </h2>
            <p>
              Our application integrates with trusted third-party service providers for authentication and hosting:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-[#A29A95]">
              <li>
                <strong className="text-[#F3EFEA]">Meta Platforms, Inc. (Facebook Login):</strong> Used solely to verify your account identity. You can manage or revoke access anytime from your Facebook Account Settings.
              </li>
              <li>
                <strong className="text-[#F3EFEA]">Google Firebase & Google Cloud:</strong> Used for secure user authentication (Firebase Auth) and database hosting.
              </li>
              <li>
                <strong className="text-[#F3EFEA]">GitHub, Inc.:</strong> Used as an optional developer sign-in method.
              </li>
            </ul>
          </section>

          {/* Section 5 - USER DATA DELETION (CRITICAL FOR META) */}
          <section id="data-deletion" className="space-y-3 p-4 bg-[#2D160B]/40 border border-[#D17BF8]/40 rounded-xl">
            <h2 className="text-lg font-bold text-[#D17BF8] flex items-center gap-2">
              <span>5. User Data Deletion Instructions (Facebook & OAuth Data)</span>
            </h2>
            <p>
              In compliance with Meta Platform Terms and General Data Protection Regulations (GDPR/CCPA), you have the right to request the complete deletion of all personal data associated with your account.
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-[#F3EFEA]">To remove Leaf VN Studio from your Facebook account:</p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-[#A29A95]">
                <li>Go to your Facebook Profile &gt; <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
                <li>In the left menu, select <strong>Apps and Websites</strong>.</li>
                <li>Find <strong>Leaf VN Studio</strong> and click <strong>Remove</strong>.</li>
                <li>Check the box to delete all posts, videos, or events that the app may have posted on your behalf (if applicable) and confirm.</li>
              </ol>
              <p className="font-semibold text-[#F3EFEA] pt-2">To request full database deletion of your Leaf VN account and cloud saves:</p>
              <p className="text-[#A29A95]">
                You can delete your cloud-stored projects directly from the in-app Project Manager by clicking the &quot;Delete&quot; icon, or send an email request to our privacy team at{' '}
                <a href="mailto:privacy@leafvn.com" className="text-[#D17BF8] underline font-mono">
                  privacy@leafvn.com
                </a>{' '}
                with the subject &quot;Data Deletion Request&quot;. Your account and associated cloud records will be permanently purged within 30 days.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#E59A5A] flex items-center gap-2">
              <span>6. Data Storage & Security</span>
            </h2>
            <p>
              We implement industry-standard encryption protocols (HTTPS/TLS) for data in transit and secure Firebase authentication standards. Project files stored locally in your browser (IndexedDB) never leave your device unless you explicitly trigger an export or cloud backup.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#E59A5A] flex items-center gap-2">
              <span>7. Contact Us</span>
            </h2>
            <p>
              If you have any questions, feedback, or concerns regarding this Privacy Policy or your personal data, please contact us at:
            </p>
            <div className="p-3 bg-[#1D0E07] border border-[#3D1E0F] rounded-lg font-mono text-xs text-[#A29A95] space-y-1">
              <div><strong>Project:</strong> Leaf VN Studio</div>
              <div><strong>Email:</strong> privacy@leafvn.com</div>
              <div><strong>Website:</strong> https://leaf-vn.firebaseapp.com</div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-[#3D1E0F] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A29A95] gap-2">
          <span>&copy; {new Date().getFullYear()} Leaf VN Studio. All rights reserved.</span>
          <Link href="/" className="hover:text-[#D17BF8] transition-colors">
            Home
          </Link>
        </div>

      </div>
    </div>
  );
}
