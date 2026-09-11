export type LegalSection = {
  heading: string
  paragraphs?: string[]
  items?: string[]
}

export type LegalDocument = {
  title: string
  description: string
  lastUpdated: string
  intro: string[]
  sections: LegalSection[]
}

export const legalDocuments = {
  terms: {
    title: "Terms and Conditions",
    description: "Terms and Conditions for Dacoo.",
    lastUpdated: "[Effective date — e.g. 24 June 2026]",
    intro: [
      "These Terms and Conditions (“Terms”) govern your access to and use of the Dacoo platform, websites, mobile applications, dashboards and related services (together, the “Service”), operated by Dacoo Co., Ltd. (“Dacoo”, “we”, “us” or “our”), a company organised under the laws of the Republic of the Union of Myanmar with its registered office at Kyaik Khauk Pagoda Road, Yangon, Myanmar.",
      "By creating an account, accessing or using the Service, you agree to be bound by these Terms and by our Privacy Policy. If you accept these Terms on behalf of a business, you confirm that you are authorised to bind that business. If you do not agree, you must not use the Service.",
    ],
    sections: [
      {
        heading: "Definitions",
        items: [
          "“Service” means the Dacoo omnichannel customer-communication platform, including the unified inbox, automation and AI-assisted features.",
          "“User”, “you” or “your” means the business or individual that registers for or uses an account.",
          "“End Customer” means any third party who communicates with you through a Connected Channel.",
          "“Connected Channel” means a third-party messaging or communication service you link to Dacoo, such as Facebook Messenger, Viber, TikTok, Telegram or email.",
          "“Content” means messages, files, contact records and other data processed through the Service.",
        ],
      },
      {
        heading: "Eligibility and Accounts",
        paragraphs: [
          "You must be at least 18 years old and capable of forming a binding contract to use the Service. You are responsible for keeping your login credentials confidential and for all activity that occurs under your account.",
          "You agree to provide accurate, current and complete information during registration and to keep it up to date. Notify us promptly of any unauthorised use of your account.",
        ],
      },
      {
        heading: "Description of the Service",
        paragraphs: [
          "Dacoo provides a unified inbox that connects multiple messaging channels into a single dashboard, together with features such as automated replies, follow-up reminders, team collaboration and AI-assisted suggestions.",
          "AI-generated outputs are provided to assist you and may be inaccurate, incomplete or unsuitable for a given situation. You are responsible for reviewing such outputs before relying on or sending them to End Customers.",
        ],
      },
      {
        heading: "Subscriptions, Plans and Payment",
        items: [
          "Fees are charged in Myanmar Kyat (MMK) unless otherwise stated, according to the plan you select at the pricing page or checkout.",
          "Subscriptions renew automatically for the chosen billing period unless cancelled before the renewal date.",
          "Except where required by applicable law, fees are non-refundable and partial periods are not pro-rated.",
          "We may change plans, features or pricing with reasonable prior notice; continued use after a change takes effect constitutes acceptance.",
          "Late or failed payment may result in suspension or termination of the Service.",
        ],
      },
      {
        heading: "Acceptable Use",
        paragraphs: ["You agree to use the Service lawfully and not to misuse it. In particular, you must not:"],
        items: [
          "Send unsolicited bulk messages (spam), or message End Customers without a lawful basis or required consent;",
          "Use the Service for any unlawful, fraudulent, deceptive, harassing, defamatory or harmful purpose;",
          "Violate the policies of any Connected Channel or third-party provider;",
          "Upload malware, attempt to gain unauthorised access, or interfere with the security or integrity of the Service;",
          "Reverse engineer, resell or sublicense the Service except as permitted by law or by us in writing;",
          "Collect or harvest data about other users or End Customers without authorisation.",
        ],
      },
      {
        heading: "Third-Party Channels and Integrations",
        paragraphs: [
          "Your use of Connected Channels is also subject to the terms and policies of the relevant providers (including the Meta Platform Terms, Viber, TikTok and Telegram). You are responsible for complying with those policies, including messaging windows, opt-in requirements and content rules.",
          "You are responsible for obtaining any consent required from End Customers before contacting them through a Connected Channel. We are not responsible for the availability, changes, suspension or actions of any third-party provider.",
        ],
      },
      {
        heading: "Intellectual Property",
        paragraphs: [
          "The Service, including its software, design, trademarks and content (excluding your Content), is owned by us or our licensors and is protected by applicable intellectual-property laws. Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable licence to use the Service for your internal business purposes.",
        ],
      },
      {
        heading: "Your Content and Data",
        paragraphs: [
          "You retain ownership of your Content. You grant us a worldwide, non-exclusive licence to host, process and transmit your Content solely to provide and improve the Service and as described in our Privacy Policy.",
          "You are responsible for the lawfulness of your Content and for ensuring you have the necessary rights and consents to collect and process End Customer data through the Service.",
        ],
      },
      {
        heading: "AI Features and Disclaimers",
        paragraphs: [
          "AI-assisted features are provided “as is”. Outputs may be inaccurate, biased or incomplete and do not constitute professional advice. You remain solely responsible for any messages you send and any decisions you make based on AI outputs.",
        ],
      },
      {
        heading: "Service Availability and Changes",
        paragraphs: [
          "We aim to keep the Service available and reliable but do not guarantee that it will be uninterrupted or error-free. We may modify, suspend or discontinue features, with reasonable notice where practicable.",
        ],
      },
      {
        heading: "Suspension and Termination",
        paragraphs: [
          "We may suspend or terminate your access if you breach these Terms, fail to pay, or where required by law. You may cancel your account at any time through your account settings.",
          "On termination, your right to use the Service ends. You may request an export of your Content within [30] days of termination, after which we may delete it in accordance with our Privacy Policy and retention practices.",
        ],
      },
      {
        heading: "Disclaimer of Warranties",
        paragraphs: [
          "To the maximum extent permitted by law, the Service is provided “as is” and “as available”, without warranties of any kind, whether express or implied, including fitness for a particular purpose, merchantability and non-infringement.",
        ],
      },
      {
        heading: "Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by the laws of Myanmar, we shall not be liable for any indirect, incidental, special, consequential or punitive damages, or for loss of profits, revenue, data or goodwill. Our total aggregate liability arising out of or relating to the Service shall not exceed the amount you paid to us in the [twelve (12)] months preceding the event giving rise to the claim.",
        ],
      },
      {
        heading: "Indemnification",
        paragraphs: [
          "You agree to indemnify and hold harmless Dacoo and its officers, employees and agents from any claims, damages, liabilities and expenses arising from your Content, your use of the Service, or your breach of these Terms or of any third-party or Connected Channel policy.",
        ],
      },
      {
        heading: "Governing Law and Dispute Resolution",
        paragraphs: [
          "These Terms are governed by the laws of the Republic of the Union of Myanmar, without regard to conflict-of-laws principles. The parties shall first attempt to resolve any dispute amicably. Failing resolution, disputes shall be subject to the exclusive jurisdiction of the competent courts of [Yangon], Myanmar [or insert your preferred arbitration clause].",
        ],
      },
      {
        heading: "Changes to These Terms",
        paragraphs: [
          "We may update these Terms from time to time. We will post the updated version and revise the “Last updated” date above. Material changes will be notified through the Service or by email. Continued use after changes take effect constitutes acceptance.",
        ],
      },
      {
        heading: "Contact Us",
        paragraphs: [
          "If you have questions about these Terms, contact Dacoo Co., Ltd. at legal@dacoo.co or by post at Kyaik Khauk Pagoda Road, Yangon, Myanmar.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "Privacy Policy for Dacoo.",
    lastUpdated: "[Effective date — e.g. 24 June 2026]",
    intro: [
      "This Privacy Policy explains how Dacoo Co., Ltd. (“Dacoo”, “we”, “us” or “our”) collects, uses, shares and protects personal data when you use the Dacoo omnichannel customer-communication platform (the “Service”). Dacoo is based in the Republic of the Union of Myanmar with its registered office at Kyaik Khauk Pagoda Road, Yangon, Myanmar.",
      "We handle personal data consistent with applicable Myanmar law, including the Law Protecting the Privacy and Security of Citizens and the Electronic Transactions Law, and with good international data-protection practice.",
    ],
    sections: [
      {
        heading: "Who We Are",
        paragraphs: [
          "Dacoo provides a unified platform that connects messaging channels such as Facebook Messenger, Viber, TikTok, Telegram and email into a single dashboard. For data you collect about your own End Customers, you act as the controller and Dacoo acts as your processor. For data about your account and your use of the Service, Dacoo acts as controller.",
        ],
      },
      {
        heading: "Information We Collect",
        items: [
          "Account and profile information: name, business name, email address, phone number and login credentials.",
          "Billing information: plan, transaction records and payment status (card details are handled by our payment providers, not stored by us).",
          "End Customer communications: messages, contact details, attachments and conversation history that pass through Connected Channels you link.",
          "Usage and log data: features used, actions taken, timestamps and diagnostic information.",
          "Device and technical data: IP address, browser type, device identifiers and cookies.",
        ],
      },
      {
        heading: "How We Collect Information",
        items: [
          "Directly from you when you register, configure the Service or contact us;",
          "Automatically through your use of the Service, including cookies and similar technologies;",
          "Through Connected Channels and integrations you authorise, which transmit messages and contact data to the Service.",
        ],
      },
      {
        heading: "How We Use Your Information",
        items: [
          "To provide, operate, maintain and secure the Service;",
          "To process subscriptions and payments;",
          "To provide AI-assisted features such as suggested replies and follow-up reminders;",
          "To communicate with you about your account, updates and support;",
          "To analyse and improve the Service;",
          "To comply with legal obligations and enforce our Terms.",
        ],
      },
      {
        heading: "Legal Basis and Consent",
        paragraphs: [
          "We process personal data where you have given consent, where processing is necessary to provide the Service you requested, to comply with a legal obligation, or for our legitimate business interests in operating and improving the Service. Where required, you are responsible for obtaining consent from your End Customers.",
        ],
      },
      {
        heading: "How We Share Information",
        items: [
          "Service providers and subprocessors who host infrastructure, process payments or provide analytics, under confidentiality obligations;",
          "Connected Channel providers (e.g. Meta, Viber, TikTok, Telegram) to deliver and receive messages you send;",
          "AI service providers that process content to generate features, under appropriate safeguards;",
          "Authorities or third parties where required by law or to protect rights and safety;",
          "A successor entity in connection with a merger, acquisition or sale of assets.",
          "We do not sell your personal data.",
        ],
      },
      {
        heading: "International Data Transfers",
        paragraphs: [
          "Some of our providers may process data outside Myanmar. Where we transfer personal data internationally, we take steps to ensure an appropriate level of protection consistent with applicable law.",
        ],
      },
      {
        heading: "Data Retention",
        paragraphs: [
          "We retain personal data for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes and enforce agreements. When data is no longer required, we delete or anonymise it.",
        ],
      },
      {
        heading: "Data Security",
        paragraphs: [
          "We use technical and organisational measures to protect personal data, as described in our Security & Data Protection statement. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
        ],
      },
      {
        heading: "Your Rights",
        paragraphs: [
          "Subject to applicable law, you may request access to, correction of, or deletion of your personal data, and you may withdraw consent where processing is based on consent. To exercise these rights, contact us at legal@dacoo.co.",
        ],
      },
      {
        heading: "End Customer Data",
        paragraphs: [
          "When you use Dacoo to communicate with your End Customers, you are responsible for handling their personal data lawfully, including providing your own privacy notice and obtaining any necessary consents. Dacoo processes that data on your behalf and according to your instructions.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: ["We use cookies and similar technologies as described in our Cookie Policy."],
      },
      {
        heading: "Children's Privacy",
        paragraphs: [
          "The Service is intended for businesses and is not directed to children under 18. We do not knowingly collect personal data from children.",
        ],
      },
      {
        heading: "Third-Party Links",
        paragraphs: [
          "The Service may link to third-party websites or services that we do not control. This Policy does not apply to those third parties, and we encourage you to review their privacy policies.",
        ],
      },
      {
        heading: "Changes to This Policy",
        paragraphs: [
          "We may update this Policy from time to time. We will post the updated version and revise the “Last updated” date above, and notify you of material changes through the Service or by email.",
        ],
      },
      {
        heading: "Contact Us",
        paragraphs: [
          "For questions or requests about this Policy or your personal data, contact Dacoo Co., Ltd. at legal@dacoo.co or by post at Kyaik Khauk Pagoda Road, Yangon, Myanmar.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    description: "Cookie Policy for Dacoo.",
    lastUpdated: "[Effective date — e.g. 24 June 2026]",
    intro: [
      "This Cookie Policy explains how Dacoo Co., Ltd. (“Dacoo”, “we”, “us” or “our”) uses cookies and similar technologies on the Dacoo websites and platform (the “Service”). It should be read together with our Privacy Policy.",
    ],
    sections: [
      {
        heading: "What Are Cookies",
        paragraphs: [
          "Cookies are small text files placed on your device when you visit a website. They help the site work, remember your preferences, and provide information to the site owner. We also use similar technologies such as local storage and pixels.",
        ],
      },
      {
        heading: "Types of Cookies We Use",
        items: [
          "Strictly necessary cookies: required for the Service to function, including authentication and security.",
          "Preference cookies: remember your settings, such as language (English or Burmese) and theme.",
          "Analytics cookies: help us understand how the Service is used so we can improve it.",
          "Performance cookies: help us monitor reliability and load times.",
        ],
      },
      {
        heading: "Third-Party Cookies",
        paragraphs: [
          "Some cookies may be set by third-party services we use, such as analytics or embedded content providers. These providers may process data according to their own policies.",
        ],
      },
      {
        heading: "How to Manage Cookies",
        paragraphs: [
          "You can control or delete cookies through your browser settings, and you can set your browser to block cookies. Please note that disabling some cookies may affect the functionality of the Service. Where required, we will ask for your consent before setting non-essential cookies.",
        ],
      },
      {
        heading: "Changes to This Policy",
        paragraphs: [
          "We may update this Cookie Policy from time to time and will revise the “Last updated” date above.",
        ],
      },
      {
        heading: "Contact Us",
        paragraphs: [
          "If you have questions about our use of cookies, contact Dacoo Co., Ltd. at legal@dacoo.co.",
        ],
      },
    ],
  },
  security: {
    title: "Security & Data Protection",
    description: "Security and data-protection information for Dacoo.",
    lastUpdated: "[Effective date — e.g. 24 June 2026]",
    intro: [
      "At Dacoo Co., Ltd. (“Dacoo”, “we”, “us” or “our”), protecting your data and that of your End Customers is a priority. This statement summarises the measures we take to keep the Dacoo platform (the “Service”) secure.",
    ],
    sections: [
      {
        heading: "Our Commitment",
        paragraphs: [
          "We apply technical and organisational measures designed to protect the confidentiality, integrity and availability of data processed through the Service, in line with good international practice and applicable Myanmar law.",
        ],
      },
      {
        heading: "Encryption",
        paragraphs: [
          "Data transmitted between you and the Service is protected using industry-standard encryption (TLS) in transit. Sensitive data at rest is encrypted using strong encryption standards.",
        ],
      },
      {
        heading: "Access Controls",
        paragraphs: [
          "Access to systems and data is restricted on a least-privilege basis. We use role-based access, strong authentication for staff, and logging of administrative activity.",
        ],
      },
      {
        heading: "Infrastructure, Hosting and Backups",
        paragraphs: [
          "The Service runs on reputable cloud infrastructure with physical and network security controls. We perform regular backups to support recovery in the event of an incident.",
        ],
      },
      {
        heading: "Monitoring and Incident Response",
        paragraphs: [
          "We monitor our systems for security events and maintain an incident-response process. If a data breach affecting your personal data occurs, we will notify affected users and authorities as required by applicable law.",
        ],
      },
      {
        heading: "Your Responsibilities",
        paragraphs: [
          "Security is a shared responsibility. Please use a strong, unique password, keep your credentials confidential, manage team access carefully, and notify us promptly of any suspected unauthorised access.",
        ],
      },
      {
        heading: "Responsible Disclosure",
        paragraphs: [
          "We welcome reports of security vulnerabilities. If you believe you have found a security issue, please contact us at legal@dacoo.co and allow us reasonable time to investigate and remediate before public disclosure.",
        ],
      },
      {
        heading: "Contact Us",
        paragraphs: [
          "For security or data-protection questions, contact Dacoo Co., Ltd. at legal@dacoo.co or by post at Kyaik Khauk Pagoda Road, Yangon, Myanmar.",
        ],
      },
    ],
  },
} satisfies Record<string, LegalDocument>
