import LegalLayout from "../components/legal/LegalLayout.jsx";

const LAST_UPDATED = "August 3, 2026";

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information we collect",
    body: [
      "We collect information your committee provides directly while setting up and running your madrassa's festival dashboard.",
    ],
    list: [
      "Madrassa profile details — name, location, contact email and phone.",
      "Student registration data — name, team, category, and registration number.",
      "Event and competition results entered by your admin team.",
      "Admin account details used to sign in and manage your dashboard.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "2. How we use information",
    body: [
      "Information is used to operate the festival dashboard and the public results pages, to communicate important updates to your committee, and to improve the product over time.",
      "We do not sell madrassa or student data to third parties, and we do not use it for advertising.",
    ],
  },
  {
    id: "student-images",
    title: "3. Student images",
    body: [
      "Milad Flow does not store student photographs on our servers. Any image you select for an achievement poster is used only in your browser to generate that poster — it is never uploaded or saved to our systems.",
    ],
  },
  {
    id: "data-retention",
    title: "4. Data retention",
    body: [
      "Festival data is retained for as long as your subscription is active, or as otherwise needed to provide the service. After that, it may be archived or permanently deleted upon your request.",
    ],
  },
  {
    id: "data-sharing",
    title: "5. Data sharing",
    body: [
      "We share data only with service providers who help us run the platform (such as hosting and email delivery), and only to the extent needed for them to perform that service. We do not share your data with other madrassas or third-party marketers.",
    ],
  },
  {
    id: "your-rights",
    title: "6. Your rights",
    body: [
      "You may request access to, correction of, or deletion of your committee's data at any time by contacting us. We aim to respond to all requests within a reasonable timeframe.",
    ],
  },
  {
    id: "security",
    title: "7. Security",
    body: [
      "We use industry-standard measures — encrypted connections, access controls, and regular backups — to protect the data you entrust to us. No system is perfectly secure, but we take reasonable steps to safeguard your information.",
    ],
  },
  {
    id: "changes",
    title: "8. Changes to this policy",
    body: [
      "We may update this policy from time to time as the product evolves. We'll update the date at the top of this page whenever we do, and material changes will be communicated to committee admins directly.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact",
    body: ["Questions about this policy can be sent to whyrowdev@gmail.com."],
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="How Milad Flow collects, uses, and protects information for your madrassa committee, students, and admins."
      updatedLabel={`Last updated: ${LAST_UPDATED}`}
      sections={sections}
      seoTitle="Privacy Policy"
      seoDescription="Read how Milad Flow collects, uses, and protects madrassa, student, and admin data across the festival dashboard and public results pages."
      seoPath="/privacy"
    />
  );
}
