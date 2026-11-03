// Single source of truth for clinic details shown on the public pages.
// Only add details you have VERIFIED. Empty values are hidden automatically (nothing is invented).
export const CLINIC = {
  name: 'Tulasi Healthcare',
  tagline: 'Psychiatric & Rehabilitation Hospital Network',
  location: 'Bengaluru, Karnataka, India',
  address: '', // TODO: full street address
  phone: '', // TODO: clinic phone number
  email: '', // TODO: clinic enquiry email
  hours: '', // TODO: e.g. 'Mon-Sat, 9am-6pm'
  emergency: 'In a mental-health emergency call 112 or Tele-MANAS 14416',
};

export const CATEGORIES = [
  { slug: 'mental-health-awareness', name: 'Mental Health Awareness' },
  { slug: 'psychiatry', name: 'Psychiatry' },
  { slug: 'psychological-therapy', name: 'Psychological Therapy' },
  { slug: 'stress-management', name: 'Stress Management' },
  { slug: 'emotional-well-being', name: 'Emotional Well-being' },
  { slug: 'sleep-and-lifestyle', name: 'Sleep and Lifestyle' },
  { slug: 'expert-insights', name: 'Expert Insights' },
];
export const categoryName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || slug;

// Drawn from what the platform actually supports (consultation modes and doctor specialties).
export const SERVICES = [
  { icon: 'Stethoscope', title: 'Psychiatry consultations', text: 'Assessment and treatment planning with experienced psychiatrists.' },
  { icon: 'MessageCircle', title: 'Psychological counselling', text: 'Talk through what you are going through with a trained professional.' },
  { icon: 'Video', title: 'Online consultations', text: 'Private video consults from wherever you are.' },
  { icon: 'Building2', title: 'In-clinic consultations', text: 'Prefer to meet in person? Book a visit at the clinic.' },
  { icon: 'Brain', title: 'Cognitive Behavioural Therapy', text: 'A structured, evidence-based therapy for anxiety, low mood and more.' },
  { icon: 'HeartHandshake', title: 'Other therapies', text: 'DBT, ACT, ERP, family, marital, mindfulness-based and interpersonal therapy.' },
];
export const THERAPIES = ['Cognitive Behavioural Therapy (CBT)', 'Dialectical Behaviour Therapy (DBT)', 'Acceptance and Commitment Therapy (ACT)', 'Exposure and Response Prevention (ERP)', 'Family therapy', 'Marital therapy', 'Mindfulness-based therapy', 'Interpersonal therapy', 'Behavioural therapy'];
export const CONDITIONS = ['Anxiety', 'Depression', 'OCD', 'Panic disorder', 'Phobias', 'Bipolar disorder', 'Schizophrenia and psychotic disorders', 'Personality disorders', 'Addiction', 'Dual diagnosis', 'Dementia and geriatric psychiatry', 'Sexual health concerns'];
export const HOW_IT_WORKS = [
  { icon: 'Search', title: 'Find a doctor', text: 'Browse our doctors and filter by specialty or by video or in-clinic consultation.' },
  { icon: 'CalendarCheck', title: 'Pick a time', text: 'Choose a day and an open slot. Your slot is held briefly while you complete payment.' },
  { icon: 'CreditCard', title: 'Pay securely', text: 'Confirm your booking with a secure online payment.' },
  { icon: 'Video', title: 'Attend your consult', text: 'Join a private video consultation, or visit the clinic.' },
  { icon: 'FileText', title: 'Get your prescription', text: 'Your doctor shares your prescription digitally, in your account.' },
];
