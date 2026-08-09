import LegalLayout from "../components/legal/LegalLayout.jsx";

const LAST_UPDATED = "August 3, 2026";

const sections = [
  {
    id: "using-milad-flow",
    title: "1. Using Milad Flow",
    body: [
      "By creating a madrassa account, you agree to use the platform to manage a genuine Milad-un-Nabi festival or similar madrassa event, and to keep your login credentials secure.",
      "You are responsible for all activity that happens under your account, including actions taken by anyone you share admin access with.",
    ],
  },
  {
    id: "subscription-billing",
    title: "2. Subscription & billing",
    body: [
      "The Madrassa Plan is billed at ₹399 per madrassa, per festival. Pricing, features, and billing cycles may be updated with reasonable advance notice.",
      "Subscriptions unlock the admin dashboard for that festival year; the public results and schedule pages remain visible to your community independent of your own future renewal.",
    ],
  },
  {
    id: "your-content",
    title: "3. Your content",
    body: [
      "Your committee retains ownership of all student, team, and results data entered into the platform. You are responsible for the accuracy of the data you publish to your public results page, and for having the right to enter any student information you provide.",
    ],
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable use",
    body: ["You agree not to:"],
    list: [
      "Misuse the platform or attempt to access another madrassa\u2019s data.",
      "Attempt to bypass, disable, or interfere with security features.",
      "Publish content that is unlawful, defamatory, or infringes on others\u2019 rights.",
      "Use the platform to send spam or unsolicited communications.",
    ],
  },
  {
    id: "availability",
    title: "5. Availability",
    body: [
      "We aim for high availability of the dashboard and public pages but do not guarantee uninterrupted, error-free service, and are not liable for losses arising from downtime or scheduled maintenance.",
    ],
  },
  {
    id: "termination",
    title: "6. Termination",
    body: [
      "Either party may end the subscription at any time. We may also suspend or terminate access for accounts that violate these terms. On termination, your data will be handled per our Privacy Policy.",
    ],
  },
  {
    id: "liability",
    title: "7. Limitation of liability",
    body: [
      'Milad Flow is provided on an "as is" basis. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the platform.',
    ],
  },
  {
    id: "changes",
    title: "8. Changes to these terms",
    body: [
      "We may update these terms as the product evolves. We'll update the date at the top of this page whenever we do, and material changes will be communicated to committee admins directly.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact",
    body: ["Questions about these terms can be sent to whyrowdev@gmail.com."],
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="The terms that govern your madrassa committee's use of the Milad Flow platform — please read them alongside our Privacy Policy."
      updatedLabel={`Last updated: ${LAST_UPDATED}`}
      sections={sections}
      seoTitle="Terms & Conditions"
      seoDescription="The terms and conditions governing use of the Milad Flow platform by madrassa committees, including subscriptions, content ownership, and acceptable use."
      seoPath="/terms"
    />
  );
}
