export interface CaseInfo {
  caseId: string;
  firNo: string;
  title?: string;
  officerName: string;
  policeStation: string;
  crime_category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  dateRegistered: string;
}

// A single row in the case list panel — deliberately kept to fields a
// non-technical viewer (e.g. a supervising officer) can read at a glance.
export interface CaseListItem {
  caseId: string;
  title: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
}

export interface LegalSectionRef {
  id: string;
  act: string;
  section: string;
  title: string;
  reason: string;
  category?: string;
}

export interface CaseLawReference {
  id: string;
  caseTitle: string;
  court?: string;
  date?: string;
  summary?: string;
}

export interface AISummary {
  complaintOverview: string;
  investigationPerformed: string;
  evidenceAnalysed: string;
  responsesReceived: string;
  currentFindings: string;
  suggestedNextSteps: string[];
}

export interface TimelineEvent {
  title: string;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'overdue';
}

export interface ResponseAnalytics {
  bank: {
    status: 'Received' | 'Pending' | 'Overdue';
    accountsAnalysed: number;
    transactionsAnalysed: number;
    suspiciousTransactions: number;
    details: string;
  };
  telecom: {
    status: 'Received' | 'Pending' | 'Overdue';
    simInfo: string;
    imei: string;
    lastTower: string;
    details: string;
  };
  onlinePlatforms: {
    status: 'Received' | 'Pending' | 'Overdue';
    details: string;
  };
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: 'Document' | 'Image' | 'Bank Statement' | 'Call Detail Record' | 'Device Image' | 'Screenshot';
  size: string;
  uploadedAt: string;
}

export interface Recommendation {
  id: string;
  text: string;
  category: 'Legal' | 'Financial' | 'Field Work' | 'Technical';
}

export interface VersionInfo {
  version: string;
  date: string;
  description: string;
  author: string;
}

export interface AuditEvent {
  id: string;
  event: string;
  user: string;
  timestamp: string;
}

export interface CaseSummaryReport {
  info: CaseInfo;
  aiSummary: AISummary;
  legalSections: LegalSectionRef[];
  caseLawReferences: CaseLawReference[];
  timeline: TimelineEvent[];
  analytics: ResponseAnalytics;
  evidence: EvidenceItem[];
  recommendations: Recommendation[];
  notes: string;
  versionHistory: VersionInfo[];
  auditTrail: AuditEvent[];
}

export interface DashboardStats {
  activeCases: number;
  pendingLegalRequests: number;
  responsesReceived: number;
  aiAlerts: number;
  closedCases: number;
}

export interface ActivityEvent {
  id: string;
  type: 'Complaint Uploaded' | 'AI Investigation Path Generated' | 'Legal Request Sent' | 'Bank Response Received' | 'Telecom Response Received' | 'Case Summary Updated';
  timestamp: string;
  caseId: string;
  details: string;
}

export interface PendingAction {
  id: string;
  type: string;
  caseId: string;
  priority: 'high' | 'medium' | 'low';
  details: string;
  dueDate: string;
}

// ==========================================
// MOCK DATA SET
// ==========================================

export const MOCK_STATS: DashboardStats = {
  activeCases: 8,
  pendingLegalRequests: 3,
  responsesReceived: 14,
  aiAlerts: 4,
  closedCases: 29
};

export const MOCK_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'Case Summary Updated',
    timestamp: '2026-07-28 17:30',
    caseId: 'FIR-2026-041',
    details: 'SI Vikram Rathore updated findings after review.'
  },
  {
    id: 'act-2',
    type: 'Telecom Response Received',
    timestamp: '2026-07-28 14:15',
    caseId: 'FIR-2026-041',
    details: 'CDR records loaded automatically for target SIM.'
  },
  {
    id: 'act-3',
    type: 'Bank Response Received',
    timestamp: '2026-07-27 11:00',
    caseId: 'FIR-2026-041',
    details: 'HDFC Bank transaction logs uploaded to case files.'
  },
  {
    id: 'act-4',
    type: 'Legal Request Sent',
    timestamp: '2026-07-26 09:30',
    caseId: 'FIR-2026-042',
    details: 'Legal notice sent to Nodal Officer of Bank.'
  },
  {
    id: 'act-5',
    type: 'AI Investigation Path Generated',
    timestamp: '2026-07-26 09:05',
    caseId: 'FIR-2026-042',
    details: 'AI Assistant mapped SOP actions and BNS sections.'
  },
  {
    id: 'act-6',
    type: 'Complaint Uploaded',
    timestamp: '2026-07-26 09:00',
    caseId: 'FIR-2026-042',
    details: 'Ingested complaint from PDF (English / Hindi bilingual).'
  }
];

export const MOCK_PENDING_ACTIONS: PendingAction[] = [
  {
    id: 'pa-1',
    type: 'Bank Response Overdue',
    caseId: 'FIR-2026-042',
    priority: 'high',
    details: 'ICICI Bank response has passed 48h SLA for freezing beneficiary account.',
    dueDate: '2026-07-28'
  },
  {
    id: 'pa-2',
    type: 'Case Summary Awaiting Review',
    caseId: 'FIR-2026-041',
    priority: 'medium',
    details: 'Final investigation summary requires review by SHO.',
    dueDate: '2026-07-30'
  },
  {
    id: 'pa-3',
    type: 'AI Suspicious Activity Alert',
    caseId: 'FIR-2026-039',
    priority: 'high',
    details: 'AI model flagged multi-layer mule transfers through linked UPI ID.',
    dueDate: '2026-07-29'
  },
  {
    id: 'pa-4',
    type: 'Telecom Request Awaiting Sent',
    caseId: 'FIR-2026-042',
    priority: 'medium',
    details: 'SDR/CDR request drafted and needs signing by SHO.',
    dueDate: '2026-07-31'
  }
];

export const MOCK_CASES_TABLE = [
  {
    caseId: 'FIR-2026-041',
    crime_category: 'UPI / Net-banking Fraud',
    status: 'Investigation Active',
    lastUpdated: '2026-07-28'
  },
  {
    caseId: 'FIR-2026-042',
    crime_category: 'Conventional - Theft',
    status: 'Pending Approvals',
    lastUpdated: '2026-07-26'
  },
  {
    caseId: 'FIR-2026-039',
    crime_category: 'Phishing / Fake Links',
    status: 'Awaiting Service Provider',
    lastUpdated: '2026-07-10'
  }
];

export const MOCK_CASE_SUMMARIES: Record<string, CaseSummaryReport> = {
  'FIR-2026-041': {
    info: {
      caseId: 'FIR-2026-041',
      firNo: 'FIR-2026-041',
      title: 'UPI QR Code Fraud - Ananya Patel',
      officerName: 'SI Vikram Rathore',
      policeStation: 'Sector 4 Cyber Cell',
      crime_category: 'UPI / Net-banking Fraud',
      priority: 'High',
      status: 'Investigation Active',
      dateRegistered: '2026-06-14'
    },
    aiSummary: {
      complaintOverview: 'Complainant Ananya Patel reported unauthorized transactions totaling INR 1,50,000 from her HDFC salary account. The fraudster induced her to scan a QR code under the guise of paying a cash prize, capturing her UPI PIN and executing transfers to a mule account in Airtel Payments Bank.',
      investigationPerformed: 'Obtained HDFC bank statement of complainant showing withdrawal. Sent legal notice to Airtel Payments Bank nodal officer. Extracted SIM details and IMEI numbers from the telecom node. Traced suspicious UPI handle to registered phone numbers and obtained Call Detail Records (CDR).',
      evidenceAnalysed: 'HDFC bank statement of the victim, Airtel Payments Bank KYC details of the beneficiary, call logs (CDR) of suspect +91 98765 43210, IMEI history mapping, and screenshots of WhatsApp communication showing QR code.',
      responsesReceived: 'Bank KYC confirmed Airtel Payments Bank account holder is "Ramesh Mandal" of Jamtara, Jharkhand (suspected mule). Telecom response provided cell tower logs placing Ramesh in Jamtara cell sectors matching times of transactions.',
      currentFindings: 'The beneficiary account belongs to Ramesh Mandal, acting as a mule account. Funds were immediately routed to 3 secondary wallets. IP address logs for the transaction indicate coordinates matching Dhanbad, Jharkhand. A linked UPI handle was verified as registered under a forged Aadhaar card.',
      suggestedNextSteps: [
        'Recommend formal freezing of beneficiary Airtel Payments Bank account and subsequent wallets.',
        'Issue Section 91 BNSS notice to Google Pay / NPCI for transaction device details.',
        'Coordinate with local police in Dhanbad/Jamtara for physical verification of suspect address.',
        'Request cell-tower dump for matching suspect device IMEI activation times.'
      ]
    },
    timeline: [
      { title: 'Complaint Registered', date: '2026-06-14 10:30', description: 'Complaint lodged on National Cyber Crime Reporting Portal (NCCRP) and FIR registered.', status: 'completed' },
      { title: 'Evidence Uploaded', date: '2026-06-15 11:20', description: 'Victim bank statements, chat screenshots, and QR image uploaded to Crime OS.', status: 'completed' },
      { title: 'AI Investigation Generated', date: '2026-06-15 11:25', description: 'AI Assistant mapped legal sections (Sec 318 BNS) and generated step-by-step SOP tracker.', status: 'completed' },
      { title: 'Legal Request Sent', date: '2026-06-16 14:00', description: 'Section 91 BNSS Notice dispatched to Nodal Officer of Airtel Payments Bank.', status: 'completed' },
      { title: 'Bank Response Received', date: '2026-07-27 11:00', description: 'Airtel Payments Bank returned beneficiary registration details and KYC.', status: 'completed' },
      { title: 'Telecom Response Received', date: '2026-07-28 14:15', description: 'Telecom nodal officer uploaded CDR and tower location logs.', status: 'completed' },
      { title: 'Case Summary Updated', date: '2026-07-28 17:30', description: 'AI refreshed investigation summary with newly received bank & telecom telemetry.', status: 'completed' }
    ],
    analytics: {
      bank: {
        status: 'Received',
        accountsAnalysed: 1,
        transactionsAnalysed: 4,
        suspiciousTransactions: 2,
        details: 'Beneficiary Airtel Payments Bank A/C No. 9876543210 (Holder: Ramesh Mandal). Suspicious routing of INR 1,50,000 to two e-wallets within 4 minutes of victim credit.'
      },
      telecom: {
        status: 'Received',
        simInfo: 'Airtel Prepaid - Activated via Forged Aadhaar',
        imei: '860432049876543',
        lastTower: 'Sector-4, Jamtara, Jharkhand (Lat: 23.96, Long: 86.80)',
        details: 'CDR indicates 18 outgoing calls to various numbers within victim registration time frame, matching high-activity calling patterns typical of phishing centers.'
      },
      onlinePlatforms: {
        status: 'Received',
        details: 'WhatsApp nodal response provided registered device ID: SM-A505F, IP logs confirm connection from Dhanbad region.'
      }
    },
    legalSections: [
      { id: 'ls-1', act: 'BNS', section: '318(4)', title: 'Cheating', reason: 'Complainant induced to scan a fraudulent QR code, matching cheating-by-deception elements.', category: 'Cyber Fraud' },
      { id: 'ls-2', act: 'IT Act', section: '66D', title: 'Cheating by personation using computer resource', reason: 'Fraud executed via UPI app impersonating a cash-prize payment request.', category: 'Cyber Fraud' }
    ],
    caseLawReferences: [
      { id: 'clr-1', caseTitle: 'State of Karnataka v. Ramesh (Mule Account Fraud)', court: 'Karnataka HC', date: '2023-11-02', summary: 'Held that mule account holders receiving proceeds of UPI fraud are liable as abettors even without direct contact with the victim.' }
    ],
    evidence: [
      { id: 'ev-1', name: 'Victim_Bank_Statement.pdf', type: 'Bank Statement', size: '2.4 MB', uploadedAt: '2026-06-15' },
      { id: 'ev-2', name: 'WhatsApp_Chat_Screenshot.png', type: 'Screenshot', size: '840 KB', uploadedAt: '2026-06-15' },
      { id: 'ev-3', name: 'Beneficiary_KYC_Airtel.pdf', type: 'Document', size: '1.2 MB', uploadedAt: '2026-07-27' },
      { id: 'ev-4', name: 'CDR_Suspect_9876543210.csv', type: 'Call Detail Record', size: '4.8 MB', uploadedAt: '2026-07-28' }
    ],
    recommendations: [
      { id: 'rec-1', text: 'Apply Section 318(4) BNS (Cheating) and Section 66D IT Act in the final chargesheet.', category: 'Legal' },
      { id: 'rec-2', text: 'Issue freezing order to Airtel Payments Bank for account no. 9876543210.', category: 'Financial' },
      { id: 'rec-3', text: 'Send request to NPCI to block UPI alias: rameshmandal@paytm.', category: 'Financial' },
      { id: 'rec-4', text: 'Conduct raid at physical coordinates logged in cell-tower sector Jamtara.', category: 'Field Work' }
    ],
    notes: 'Primary suspect identified. Awaiting physical verification from local police in Jamtara. The victim is cooperating and has signed the panchnama copy.',
    versionHistory: [
      { version: 'v1.0 (Initial)', date: '2026-06-15', description: 'Generated automatically from ingested complaint PDF.', author: 'Crime OS AI' },
      { version: 'v1.1 (Bank Update)', date: '2026-07-27', description: 'Updated automatically with beneficiary Airtel Payments Bank KYC details.', author: 'Crime OS AI' },
      { version: 'v1.2 (Telecom Update)', date: '2026-07-28', description: 'Updated with CDR and Tower logs. Suspect coordinates pinned to Jamtara area.', author: 'Crime OS AI' }
    ],
    auditTrail: [
      { id: 'au-1', event: 'Investigation Report Generated', user: 'System (AI)', timestamp: '2026-06-15 11:25' },
      { id: 'au-2', event: 'Legal Request for KYC Sent', user: 'SI Vikram Rathore', timestamp: '2026-06-16 14:00' },
      { id: 'au-3', event: 'Bank KYC response uploaded', user: 'System (Bank API)', timestamp: '2026-07-27 11:00' },
      { id: 'au-4', event: 'Telecom CDR uploaded', user: 'System (Telecom Portal)', timestamp: '2026-07-28 14:15' },
      { id: 'au-5', event: 'Officer Notes Edited', user: 'SI Vikram Rathore', timestamp: '2026-07-28 17:30' }
    ]
  },
  'FIR-2026-042': {
    info: {
      caseId: 'FIR-2026-042',
      firNo: 'FIR-2026-042',
      title: 'Residential Burglary - Rahul Sharma',
      officerName: 'SI Vikram Rathore',
      policeStation: 'Sector 4 Cyber Cell',
      crime_category: 'Conventional - Theft',
      priority: 'Medium',
      status: 'Pending Approvals',
      dateRegistered: '2026-06-13'
    },
    aiSummary: {
      complaintOverview: 'Complainant Rahul Sharma reported the theft of his high-end laptop, tablet, and smart watch from his apartment. The theft took place during the afternoon hours while the complainant was at work. Access was gained by breaking the secondary locks of the balcony door.',
      investigationPerformed: 'Inspected the crime scene and created panchnama. Collected CCTV footage from apartment security cameras and entrance gateway. Interviewed security guards and residential staff.',
      evidenceAnalysed: 'CCTV video files showing entrance/exit times of residents, broken lock physical evidence, list of stolen electronic serial numbers.',
      responsesReceived: 'Awaiting local pawn-shop register review and electronic device network activation pings from manufacturers.',
      currentFindings: 'An unknown male in a black cap and jacket entered the building at 14:10 and left at 14:45 carrying a heavy backpack. Ground staff failed to log the identity of the person. Serial numbers of the laptop and tablet have been registered on national lost-property registry database.',
      suggestedNextSteps: [
        'Coordinate with electronic manufacturers (Apple, Lenovo) for location ping reports upon internet connection.',
        'Distribute CCTV suspect face snapshots to neighboring police stations.',
        'Review CCTV footage from outer street cameras to identify vehicles used by suspect.'
      ]
    },
    timeline: [
      { title: 'Complaint Registered', date: '2026-06-13 18:00', description: 'Complaint registered at Sector 4 police station.', status: 'completed' },
      { title: 'Evidence Uploaded', date: '2026-06-14 09:30', description: 'Scene photos and list of serial numbers uploaded.', status: 'completed' },
      { title: 'AI Investigation Generated', date: '2026-06-14 10:00', description: 'AI suggested SOP check for residential thefts and relevant IPC/BNS codes.', status: 'completed' },
      { title: 'Legal Request Sent', date: '2026-07-26 09:30', description: 'Legal request drafted to ISP/manufacturers for IP tracing of serial numbers.', status: 'completed' }
    ],
    analytics: {
      bank: {
        status: 'Pending',
        accountsAnalysed: 0,
        transactionsAnalysed: 0,
        suspiciousTransactions: 0,
        details: 'Not applicable for current case stage. Legal suggestion recommends checking suspect transaction logs if pawn activity is detected.'
      },
      telecom: {
        status: 'Pending',
        simInfo: 'Pending network pings',
        imei: '359876123456789 (Stolen Tablet Cellular)',
        lastTower: 'None logged',
        details: 'Telecom cell tracker notice dispatched. Waiting for SIM card activation logs.'
      },
      onlinePlatforms: {
        status: 'Pending',
        details: 'Awaiting device MAC address login logs from Google Account security telemetry.'
      }
    },
    legalSections: [
      { id: 'ls-3', act: 'BNS', section: '305(a)', title: 'Theft in a dwelling house', reason: 'Entry gained through the balcony door of the complainant\u2019s residence while unoccupied.', category: 'Property Offence' }
    ],
    caseLawReferences: [],
    evidence: [
      { id: 'ev-5', name: 'Scene_Of_Crime_Photos.zip', type: 'Image', size: '12 MB', uploadedAt: '2026-06-14' },
      { id: 'ev-6', name: 'CCTV_Entry_Exit.mp4', type: 'Device Image', size: '45 MB', uploadedAt: '2026-06-14' }
    ],
    recommendations: [
      { id: 'rec-5', text: 'File u/s 305(a) BNS (Theft in dwelling house).', category: 'Legal' },
      { id: 'rec-6', text: 'Obtain tower dump of the building vicinity for the window 14:00 - 15:00.', category: 'Technical' },
      { id: 'rec-7', text: 'Examine local second-hand electronics markets in the district.', category: 'Field Work' }
    ],
    notes: 'Balcony door lock was old and easily bypassed. Suspect was aware of security guard routines. Suspect physical profile matches an ex-worker in the complex.',
    versionHistory: [
      { version: 'v1.0 (Initial)', date: '2026-06-14', description: 'Created from initial FIR report details.', author: 'Crime OS AI' }
    ],
    auditTrail: [
      { id: 'au-6', event: 'Case Registered', user: 'Duty Officer', timestamp: '2026-06-13 18:00' },
      { id: 'au-7', event: 'Photos Uploaded', user: 'SI Vikram Rathore', timestamp: '2026-06-14 09:30' },
      { id: 'au-8', event: 'AI Path Created', user: 'System (AI)', timestamp: '2026-06-14 10:00' }
    ]
  },
  'FIR-2026-039': {
    info: {
      caseId: 'FIR-2026-039',
      firNo: 'FIR-2026-039',
      title: 'Electricity Bill Phishing - Vikram Singh',
      officerName: 'SI Vikram Rathore',
      policeStation: 'Sector 4 Cyber Cell',
      crime_category: 'Phishing / Fake Links',
      priority: 'High',
      status: 'Awaiting Service Provider',
      dateRegistered: '2026-06-10'
    },
    aiSummary: {
      complaintOverview: 'Complainant Vikram Singh clicked on a fake SMS link purporting to update his electricity bill. After entering credentials on the phishing site, a debit of INR 85,000 occurred from his Bank of Baroda account, which was routed to a merchant wallet.',
      investigationPerformed: 'Requested IP address log of the phishing domain hosting service. Tracked the payment gateway merchant account details.',
      evidenceAnalysed: 'SMS screenshot containing the URL `http://electricity-bill-pay-update.net`, transaction receipt, gateway payment logs.',
      responsesReceived: 'Merchant account details obtained. Phishing domain host IP tracked to a virtual private server in Singapore.',
      currentFindings: 'Phishing URL was active for 24 hours. The domain was purchased using crypto assets. The merchant wallet belongs to a retail distributor in Noida, who claims their online platform was compromised or credentials leaked.',
      suggestedNextSteps: [
        'Issue notice to the merchant gateway aggregator for KYC of sub-merchants.',
        'Trace the source of crypto domain purchase via blockchain scanner details.',
        'Request registrar detail logs for domain `electricity-bill-pay-update.net`.'
      ]
    },
    timeline: [
      { title: 'Complaint Registered', date: '2026-06-10 11:00', description: 'Electricity bill phishing complaint registered.', status: 'completed' },
      { title: 'Evidence Uploaded', date: '2026-06-10 11:30', description: 'SMS screenshot and transaction receipt uploaded.', status: 'completed' },
      { title: 'AI Investigation Generated', date: '2026-06-10 12:00', description: 'Phishing domain analysis suggestions generated.', status: 'completed' },
      { title: 'Legal Request Sent', date: '2026-06-12 10:00', description: 'Section 91 BNSS notices sent to Domain Registrar and Gateway Nodal.', status: 'completed' }
    ],
    analytics: {
      bank: {
        status: 'Received',
        accountsAnalysed: 1,
        transactionsAnalysed: 1,
        suspiciousTransactions: 1,
        details: 'Debit of INR 85,000 from Bank of Baroda. Beneficiary merchant: PayTM Sub-merchant PG-1102.'
      },
      telecom: {
        status: 'Pending',
        simInfo: 'Phishing SMS sender number +91 99999 88888',
        imei: 'Unknown',
        lastTower: 'Unknown',
        details: 'Request for subscriber details sent to telecom operator. Telecom response overdue by 4 days.'
      },
      onlinePlatforms: {
        status: 'Pending',
        details: 'Request to SMS Gateway Aggregator pending.'
      }
    },
    legalSections: [
      { id: 'ls-4', act: 'BNS', section: '319', title: 'Cheating by personation', reason: 'Fraudster impersonated the electricity board via a spoofed SMS and phishing link.', category: 'Cyber Fraud' },
      { id: 'ls-5', act: 'IT Act', section: '66C', title: 'Identity theft', reason: 'Victim\u2019s net-banking credentials were captured through the phishing site.', category: 'Cyber Fraud' }
    ],
    caseLawReferences: [
      { id: 'clr-2', caseTitle: 'National Cyber Cell v. Unknown (Domain Phishing)', court: 'Delhi HC', date: '2024-02-19', summary: 'Discussed jurisdiction and evidentiary standards for phishing domains hosted on foreign VPS infrastructure.' }
    ],
    evidence: [
      { id: 'ev-7', name: 'SMS_Phishing_Screenshot.jpg', type: 'Screenshot', size: '1.1 MB', uploadedAt: '2026-06-10' },
      { id: 'ev-8', name: 'BoB_Transaction_Receipt.pdf', type: 'Bank Statement', size: '540 KB', uploadedAt: '2026-06-10' }
    ],
    recommendations: [
      { id: 'rec-8', text: 'Incorporate Sec 319 BNS (Cheating by personation) and Sec 66C IT Act.', category: 'Legal' },
      { id: 'rec-9', text: 'Obtain API logs of the sub-merchant gateway account from Paytm.', category: 'Technical' },
      { id: 'rec-10', text: 'Block the phishing domain via national cyber cell gateway.', category: 'Technical' }
    ],
    notes: 'SMS header utilized was fake/spoofed. Domain host is uncooperative; requesting international cyber cooperation channel info.',
    versionHistory: [
      { version: 'v1.0 (Initial)', date: '2026-06-10', description: 'Phishing attack analysis generated.', author: 'Crime OS AI' }
    ],
    auditTrail: [
      { id: 'au-9', event: 'Case Registered', user: 'Duty Officer', timestamp: '2026-06-10 11:00' },
      { id: 'au-10', event: 'Notice Issued to Domain Host', user: 'SI Vikram Rathore', timestamp: '2026-06-12 10:00' }
    ]
  }
};

// Case list panel derived from the full mock reports — kept to the fields
// a non-technical viewer needs: title, status, priority, date.
export const MOCK_CASE_LIST: CaseListItem[] = Object.values(MOCK_CASE_SUMMARIES).map((r) => ({
  caseId: r.info.caseId,
  title: r.info.title || r.info.crime_category,
  status: r.info.status,
  priority: r.info.priority,
  date: r.info.dateRegistered
}));