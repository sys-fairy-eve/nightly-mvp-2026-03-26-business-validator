// Client-side analysis engine — keyword matching + templates, no API calls

export interface PhaseResult {
  id: number;
  title: string;
  icon: string;
  color: string;
  score: number; // 1-5
  insights: string[];
  actionPrompt: string;
  details: string;
}

export interface ValidationResult {
  overallScore: number; // 0-100
  phases: PhaseResult[];
  strengths: string[];
  risks: string[];
  nextSteps: string[];
  ideaType: string;
}

type IdeaType = 'saas' | 'marketplace' | 'app' | 'tool' | 'platform' | 'service' | 'content' | 'ecommerce' | 'community' | 'general';

function detectIdeaType(idea: string): IdeaType {
  const lower = idea.toLowerCase();
  if (/saas|subscription|software as a service|monthly fee/.test(lower)) return 'saas';
  if (/marketplace|buy.{0,10}sell|connect.{0,20}(buyers|sellers|providers)|platform for (finding|hiring)/.test(lower)) return 'marketplace';
  if (/mobile app|ios|android|phone app/.test(lower)) return 'app';
  if (/tool|utility|plugin|extension|widget/.test(lower)) return 'tool';
  if (/platform|ecosystem|network effect/.test(lower)) return 'platform';
  if (/service|consulting|agency|freelance|coaching/.test(lower)) return 'service';
  if (/content|newsletter|blog|podcast|course|education|learn/.test(lower)) return 'content';
  if (/shop|store|ecommerce|sell|product|physical/.test(lower)) return 'ecommerce';
  if (/community|forum|group|club|membership/.test(lower)) return 'community';
  return 'general';
}

function extractKeywords(idea: string): string[] {
  const lower = idea.toLowerCase();
  const keywords: string[] = [];
  
  const domainKeywords = [
    'fitness', 'health', 'wellness', 'medical', 'healthcare',
    'finance', 'money', 'investment', 'banking', 'crypto',
    'education', 'learning', 'students', 'teachers', 'school',
    'travel', 'vacation', 'hotel', 'booking', 'tourism',
    'food', 'restaurant', 'cooking', 'recipe', 'delivery',
    'real estate', 'property', 'housing', 'rental',
    'fashion', 'clothing', 'style', 'wardrobe',
    'productivity', 'workflow', 'automation', 'efficiency',
    'developer', 'coding', 'programming', 'software', 'api',
    'design', 'creative', 'art', 'visual',
    'social', 'networking', 'community', 'friends',
    'freelance', 'remote work', 'hiring', 'jobs',
    'pet', 'dog', 'cat', 'animal',
    'music', 'audio', 'podcast', 'entertainment',
    'sustainability', 'green', 'eco', 'environment',
  ];
  
  for (const kw of domainKeywords) {
    if (lower.includes(kw)) keywords.push(kw);
  }
  
  return keywords;
}

function getSpecificityScore(idea: string): number {
  const words = idea.split(/\s+/).length;
  const hasTarget = /for (developers|designers|students|freelancers|small businesses|startups|parents|teachers|seniors|athletes|professionals)/i.test(idea);
  const hasAction = /help|enable|allow|let|make it easy|simplify|automate|track|manage|connect|build|create/i.test(idea);
  const hasProblem = /problem|pain|struggle|difficult|hard|annoying|frustrating|time-consuming|expensive/i.test(idea);
  
  let score = 1;
  if (words > 10) score++;
  if (words > 20) score++;
  if (hasTarget) score++;
  if (hasAction || hasProblem) score++;
  
  return Math.min(5, score);
}

function getCommunityPhase(_idea: string, ideaType: IdeaType, keywords: string[]): PhaseResult {
  const communityMap: Record<string, string[]> = {
    fitness: ['r/fitness, r/bodybuilding', 'Facebook fitness groups', 'Strava communities', 'local gym WhatsApp groups'],
    health: ['patient advocacy forums', 'r/health', 'condition-specific Facebook groups', 'PatientsLikeMe'],
    developer: ['r/programming, Hacker News', 'Dev.to community', 'Stack Overflow', 'Discord dev servers'],
    education: ['r/teachers, r/learnprogramming', 'EdSurge community', 'teacher Facebook groups', 'LinkedIn educator groups'],
    finance: ['r/personalfinance, r/investing', 'Bogleheads forum', 'financial Twitter (FinTwit)'],
    productivity: ['r/productivity, r/GTD', 'Notion community', 'Slack productivity communities'],
    design: ['Dribbble, Behance', 'r/UI_Design', 'Designer Slack groups', 'Figma community'],
    travel: ['r/travel, r/solotravel', 'TripAdvisor forums', 'travel Facebook groups', 'Nomad List community'],
    food: ['r/cooking, r/food', 'local food Facebook groups', 'Yelp Elite community'],
    freelance: ['r/freelance', 'Upwork community forums', 'Freelancers Union', 'LinkedIn freelancer groups'],
  };
  
  let communities = ['niche subreddits', 'Facebook Groups', 'Discord servers', 'LinkedIn groups', 'Twitter/X communities'];
  for (const kw of keywords) {
    if (communityMap[kw]) {
      communities = communityMap[kw];
      break;
    }
  }
  
  const targetDesc = ideaType === 'saas' ? 'B2B decision makers' :
    ideaType === 'marketplace' ? 'both buyers and sellers' :
    ideaType === 'service' ? 'clients who need this service' :
    ideaType === 'content' ? 'readers/listeners in this niche' :
    'early adopters';
  
  return {
    id: 1,
    title: 'Community',
    icon: '🏘️',
    color: '#6366f1',
    score: 3,
    insights: [
      `Your 1,000 true fans are likely ${targetDesc} frustrated with current solutions`,
      `Start communities: ${communities.slice(0, 3).join(', ')}`,
      `Before building, spend 2 weeks lurking and asking questions in these spaces`,
    ],
    actionPrompt: 'Join 3 communities where your target customers already gather. Don\'t pitch. Listen first.',
    details: 'The Minimalist Entrepreneur starts with community, not product. Find people who share the problem, earn their trust, then build what they ask for.',
  };
}

function getProblemPhase(idea: string, specificity: number): PhaseResult {
  const hasClearPain = /pain|struggle|difficult|hard|annoying|frustrating|waste|slow|expensive|broken/i.test(idea);
  const hasCompetition = /better than|instead of|unlike|alternative to|replace/i.test(idea);
  
  const clarityScore = specificity;
  const painScore = hasClearPain ? 4 : 2;
  const solutionScore = hasCompetition ? 3 : 2;
  const avgScore = Math.round((clarityScore + painScore + solutionScore) / 3);
  
  return {
    id: 2,
    title: 'Problem Validation',
    icon: '✅',
    color: '#10b981',
    score: avgScore,
    insights: [
      `Problem Clarity: ${clarityScore}/5 — ${clarityScore >= 3 ? 'reasonably well-defined' : 'needs more specificity'}`,
      `Pain Level: ${painScore}/5 — ${hasClearPain ? 'clear urgency signal in your description' : 'no explicit pain mentioned — dig deeper'}`,
      `Competition Awareness: ${solutionScore}/5 — ${hasCompetition ? 'you\'ve acknowledged alternatives' : 'research what people do today instead'}`,
    ],
    actionPrompt: 'Before writing code: talk to 10 potential customers. Ask "What\'s the hardest part of X?" — don\'t pitch your solution.',
    details: 'A problem worth solving is urgent, pervasive, and underserved. Score yourself honestly before investing months.',
  };
}

function getMVPPhase(ideaType: IdeaType, _idea: string): PhaseResult {
  const mvpSuggestions: Record<IdeaType, string[]> = {
    saas: [
      'Start with a Google Sheet or Notion template that does the core function manually',
      'Offer it as a done-for-you service first — charge before you build',
      'Build a single-feature landing page with a waitlist to measure demand',
    ],
    marketplace: [
      'Do it by hand first — manually match buyers and sellers over email/WhatsApp',
      'Curate a simple list/directory before building matching algorithms',
      'Use Typeform for supply side + personal emails for demand side',
    ],
    app: [
      'Build a mobile-responsive web app first — skip the App Store entirely',
      'Use no-code tools (Glide, Bubble) for v0.1',
      'A Telegram bot can replace a native app for many use cases',
    ],
    tool: [
      'A CLI script or browser bookmark is often enough for v0.1',
      'A Google Chrome extension can be built in a weekend',
      'Share a manual process first (checklist/template) and see if people use it',
    ],
    platform: [
      'Platforms need two-sided networks — start with ONE side and serve them manually',
      'Be the platform yourself: do the curation, matching, or work by hand',
      'A newsletter or group chat is a platform at 0 code',
    ],
    service: [
      'Just start doing the service — no website needed for first 5 clients',
      'A clear offer on LinkedIn is enough for a service business',
      'Productize one repeatable deliverable before building systems',
    ],
    content: [
      'Write one piece of content and see if it resonates before building a "platform"',
      'A free newsletter (Substack, Ghost) is a complete content business MVP',
      'Record a 5-min video explaining the problem — distribution before creation',
    ],
    ecommerce: [
      'Sell one product manually (Instagram DMs, Gumroad) before a full store',
      'Use Shopify starter plan — don\'t build custom',
      'Test demand with a pre-order or waitlist before sourcing inventory',
    ],
    community: [
      'A Slack/Discord group or Facebook Group costs zero and takes 1 hour',
      'A weekly Zoom call IS a community at MVP stage',
      'Reach out to 20 people personally — email beats a sign-up form',
    ],
    general: [
      'Start with a landing page + email waitlist — measure demand before building',
      'Do the thing manually for your first 10 customers',
      'Write down the exact steps you\'d do by hand — that\'s your MVP spec',
    ],
  };
  
  return {
    id: 3,
    title: 'Smallest Viable Product',
    icon: '🔨',
    color: '#f59e0b',
    score: 4,
    insights: mvpSuggestions[ideaType],
    actionPrompt: 'Can you deliver the core value to one customer by hand, today, without any technology?',
    details: 'The MVP should be embarrassingly small. Not "minimum viable product" — think "manual viable process". Do it by hand first, automate later.',
  };
}

function getProcessPhase(ideaType: IdeaType): PhaseResult {
  const processMap: Record<IdeaType, string[]> = {
    saas: [
      'Step 1: Customer onboarding (what info do you need from them?)',
      'Step 2: The core service delivery (what do you actually do for them?)',
      'Step 3: Feedback loop (how do you know it worked?)',
    ],
    marketplace: [
      'Step 1: Acquire supply (how do you get sellers/providers?)',
      'Step 2: Qualify supply (how do you ensure quality?)',
      'Step 3: Match with demand (how do you connect the right buyers?)',
      'Step 4: Facilitate transaction (how do money and goods move?)',
    ],
    service: [
      'Step 1: Lead qualification (is this a good fit?)',
      'Step 2: Scoping/proposal (what exactly will you deliver?)',
      'Step 3: Delivery (the actual work)',
      'Step 4: Review and handoff (how do you close the loop?)',
    ],
    content: [
      'Step 1: Topic research (what does your audience need to know?)',
      'Step 2: Content creation (writing, recording, designing)',
      'Step 3: Publishing and distribution',
      'Step 4: Engagement (responding to comments, DMs)',
    ],
    general: [
      'Step 1: Customer acquisition (how do they find you?)',
      'Step 2: Qualification (is this the right customer?)',
      'Step 3: Value delivery (the core thing you do)',
      'Step 4: Retention (what keeps them coming back?)',
    ],
    app: [
      'Step 1: User signs up / onboards',
      'Step 2: User inputs their data or problem',
      'Step 3: App processes and returns value',
      'Step 4: User takes action based on output',
    ],
    tool: [
      'Step 1: User discovers problem tool solves',
      'Step 2: Setup / configuration (keep this minimal)',
      'Step 3: Core use case (the single thing they do every time)',
      'Step 4: Seeing the result / output',
    ],
    platform: [
      'Step 1: Supply side acquisition and vetting',
      'Step 2: Demand side acquisition',
      'Step 3: Matching / discovery mechanism',
      'Step 4: Value exchange facilitation',
    ],
    ecommerce: [
      'Step 1: Product discovery (how do they find your products?)',
      'Step 2: Evaluation (photos, descriptions, reviews)',
      'Step 3: Purchase and payment',
      'Step 4: Fulfillment and customer support',
    ],
    community: [
      'Step 1: Member discovery and invitation',
      'Step 2: Onboarding (what\'s the community about? what to do first?)',
      'Step 3: Engagement loops (what brings people back?)',
      'Step 4: Value creation (what do members get from each other?)',
    ],
  };
  
  const steps = processMap[ideaType] || processMap.general;
  
  return {
    id: 4,
    title: 'Processizing',
    icon: '⚙️',
    color: '#8b5cf6',
    score: 3,
    insights: steps,
    actionPrompt: 'Write out the exact steps you\'d follow for Customer #1. That document becomes your process.',
    details: 'Before automating, document. A repeatable manual process is more valuable than half-built software. Map every step, then identify what\'s worth automating first.',
  };
}

function getCustomersPhase(ideaType: IdeaType, _keywords: string[]): PhaseResult {
  const channelMap: Record<IdeaType, string[]> = {
    saas: [
      'Cold outreach to potential users on LinkedIn (personalized, not spammy)',
      'Post in communities where your users hang out — be genuinely helpful first',
      'Product Hunt launch once you have something to show',
      'Content marketing: write about the problem your tool solves',
    ],
    marketplace: [
      'Manually recruit supply side first — DM potential providers directly',
      'Tap your personal network for the first 10 transactions',
      'Local Facebook groups and community boards for hyperlocal marketplaces',
      'Partner with adjacent businesses that serve the same customers',
    ],
    service: [
      'Your existing network: email everyone you know about what you now offer',
      'LinkedIn: update your profile, post about your expertise, share case studies',
      'Ask for referrals from first clients — this is your highest-converting channel',
      'Guest posts and podcast appearances to establish credibility',
    ],
    content: [
      'Cross-post to communities where your audience already hangs out',
      'Guest-write for established newsletters/blogs in your niche',
      'Twitter/X: reply to thought leaders with genuine insights',
      'Partner with creators at a similar stage for cross-promotion',
    ],
    general: [
      'Start with people you know — personal network is fastest for first 10',
      'Communities: forums, subreddits, Discord/Slack groups in your niche',
      'Cold outreach with a personalized, specific ask',
      'Content: teach what you know, attract people who need it',
    ],
    app: [
      'Beta invite list: convert waitlist with personal outreach',
      'App Store optimization once launched',
      'TikTok/YouTube demo videos showing the key use case',
      'Invite-only to create exclusivity for initial growth',
    ],
    tool: [
      'Share in developer/professional communities (HN Show HN, relevant subreddits)',
      'Build a free version with paid upgrade — let the tool spread itself',
      'GitHub if open source — stars and issues drive discovery',
      'Integrations with popular tools bring their user bases to you',
    ],
    platform: [
      'Focus all energy on supply side first — quality supply attracts demand',
      'Curate obsessively until network effects kick in',
      'White-glove onboard your first 20 users manually',
      'Find the watering holes where both sides already gather',
    ],
    ecommerce: [
      'Instagram and Pinterest for visual products — organic first',
      'Local markets and pop-ups to validate in person before scaling online',
      'Influencer gifting for niche products (micro-influencers have better ROI)',
      'Email list from day one — own your distribution',
    ],
    community: [
      'Personally invite 20 people you know who have the shared interest',
      'Partner with adjacent communities for cross-promotion',
      'Host a free event (IRL or virtual) to seed the community',
      'Create something valuable for free to attract the right people',
    ],
  };
  
  const channels = channelMap[ideaType] || channelMap.general;
  
  return {
    id: 5,
    title: 'First 100 Customers',
    icon: '🎯',
    color: '#ef4444',
    score: 3,
    insights: channels,
    actionPrompt: '"Teach everything you know." Write one helpful piece of content about the problem you solve — then share it where your customers already are.',
    details: 'Your first 100 customers should come from community, not advertising. Be the most helpful person in the room. Don\'t sell — serve.',
  };
}

function getPricingPhase(ideaType: IdeaType, _idea: string): PhaseResult {
  const pricingMap: Record<IdeaType, { tiers: string[], principle: string }> = {
    saas: {
      tiers: ['Free tier: limited usage (builds audience)', 'Starter: $29-49/mo (solo founders/freelancers)', 'Pro: $99-149/mo (small teams)', 'Business: $299+/mo (companies)'],
      principle: 'Charge more than you think. B2B SaaS buyers expect to pay.',
    },
    marketplace: {
      tiers: ['Commission model: 10-20% on transactions', 'Subscription for power sellers/buyers', 'Featured listings as premium tier'],
      principle: 'Don\'t charge until you\'ve facilitated real value. Then charge for what\'s working.',
    },
    service: {
      tiers: ['Project-based: $500-5,000 for defined deliverables', 'Retainer: $1,500-5,000/mo for ongoing work', 'Premium: $10,000+ for high-touch enterprise'],
      principle: 'Double your rate. Seriously. Underpricing signals low confidence and attracts bad clients.',
    },
    content: {
      tiers: ['Free newsletter: build the list first', 'Paid tier: $5-15/mo for premium content', 'Course/workshop: $99-499 one-time', 'Community membership: $25-100/mo'],
      principle: 'Start charging earlier than feels comfortable. Free content is marketing; paid content is business.',
    },
    app: {
      tiers: ['Free trial: 14-30 days full access', 'Individual: $5-15/mo', 'Teams: $25-50/mo per seat', 'Enterprise: custom'],
      principle: 'Free trials convert better than freemium for most apps. Freemium = free users who never convert.',
    },
    tool: {
      tiers: ['Free forever for basic use (viral distribution)', 'Pro: $9-19/mo for power features', 'Teams: $29-49/mo', 'API/enterprise: custom'],
      principle: 'Tools can go freemium — the free tier does the marketing. Make the paid tier obviously worth it.',
    },
    platform: {
      tiers: ['Free during growth phase: grow both sides first', 'Subscription for enhanced access/features', 'Commission on high-value transactions'],
      principle: 'Wait to monetize until value is obvious to both sides. Then charge the side that gets more value.',
    },
    ecommerce: {
      tiers: ['Price at 3-5x cost of goods', 'Bundle deals for higher AOV', 'Subscription box if product has recurring demand'],
      principle: 'Margin is your oxygen. Price for 60-70% gross margin or you won\'t survive scaling.',
    },
    community: {
      tiers: ['Free tier: open to all (community growth)', 'Paid tier: $20-100/mo for premium access/events', 'Annual plan: 20-30% discount to improve cash flow'],
      principle: 'Community members who pay are more engaged than free members. Don\'t fear the paywall.',
    },
    general: {
      tiers: ['Start with one price: simple and easy to understand', 'Add tiers only after you understand usage patterns', 'Consider freemium only if free users genuinely drive paid acquisition'],
      principle: 'Charge something from day one. Free is a business model decision, not a default.',
    },
  };
  
  const pricing = pricingMap[ideaType] || pricingMap.general;
  
  return {
    id: 6,
    title: 'Pricing',
    icon: '💰',
    color: '#f59e0b',
    score: 3,
    insights: pricing.tiers,
    actionPrompt: `"${pricing.principle}" — Set a price today. You can always adjust.`,
    details: 'The Minimalist Entrepreneur charges from day one. Revenue validates that you\'re solving a real problem. Revenue funds your next month of building.',
  };
}

function getMarketingPhase(_idea: string, keywords: string[], ideaType: IdeaType): PhaseResult {
  const topicSeed = keywords.length > 0 ? keywords[0] : ideaType;
  
  const contentIdeas = [
    `"The ${topicSeed} problem no one talks about" — surface a hidden pain your audience faces`,
    `"How I solved [specific problem] in [your niche]" — practical how-to with real results`,
    `"${topicSeed} toolkit 2025: what actually works" — curate the best tools/resources`,
    `"The [your niche] founder's biggest mistake" — contrarian take drives discussion`,
    `"Before you build: what I wish I knew about ${topicSeed}" — lessons from early stage`,
  ];
  
  return {
    id: 7,
    title: 'Marketing',
    icon: '📢',
    color: '#3b82f6',
    score: 3,
    insights: [
      '"Educate, don\'t sell." Create content that helps people even if they never buy from you.',
      `Content angles for your niche: ${contentIdeas.slice(0, 2).join(' | ')}`,
      'Distribution beats creation: one good piece shared in 5 communities > 10 pieces shared nowhere',
    ],
    actionPrompt: 'Write one useful, shareable post about the problem you solve. Publish it in one community. See what happens.',
    details: 'Minimalist marketing is about being genuinely useful at scale. Your content attracts the audience who already has the problem you solve.',
  };
}

function getGrowthPhase(): PhaseResult {
  return {
    id: 8,
    title: 'Sustainable Growth',
    icon: '📈',
    color: '#10b981',
    score: 3,
    insights: [
      'Profitability-first metrics: revenue, gross margin, monthly burn — before vanity metrics',
      'Don\'t hire until it hurts. Automate before you delegate. Delegate before you hire.',
      'Warning signs: growing headcount faster than revenue, raising money to cover losses, optimizing for MAU over paying customers',
    ],
    actionPrompt: 'Calculate your "default alive" date: at current burn rate, when do you run out of money? Make sure it\'s never.',
    details: 'Sustainable growth means you grow when you can afford to, not when VCs tell you to. Profitability isn\'t a constraint — it\'s a superpower.',
  };
}

function getCulturePhase(ideaType: IdeaType): PhaseResult {
  const valuesPrompts: Record<string, string[]> = {
    saas: [
      'Default to transparency: open roadmap, honest pricing, clear limitations',
      'Serve the customer, not the investor: optimize for retention, not acquisition metrics',
      'Ship fast, fix fast: speed and accountability over perfection',
    ],
    service: [
      'Deliver what you promise, then a little more: reputation is your only moat',
      'Say no to clients who aren\'t a fit: protect your time and theirs',
      'Document everything: your process is your product',
    ],
    community: [
      'Psychological safety first: people share when they feel safe to be wrong',
      'Curation over growth: 100 engaged members > 10,000 lurkers',
      'Members are owners: give them voice in how the community evolves',
    ],
    general: [
      'Work on something you\'d be proud to explain to someone who cares about the world',
      'Treat customers like people, not metrics',
      'Build the company you\'d want to work at — you\'ll be there a long time',
    ],
  };
  
  const values = valuesPrompts[ideaType] || valuesPrompts.general;
  
  return {
    id: 9,
    title: 'Culture & Values',
    icon: '🌱',
    color: '#84cc16',
    score: 4,
    insights: values,
    actionPrompt: 'Write 3 values for your company. Not aspirational platitudes — concrete behaviors you\'d use to evaluate a hire.',
    details: 'Culture is what you do when no one\'s watching. Set it intentionally from day one, or it sets itself (usually badly).',
  };
}

function getReviewPhase(overallScore: number, idea: string, ideaType: IdeaType): PhaseResult {
  const strengths: string[] = [];
  const risks: string[] = [];
  
  if (overallScore >= 60) strengths.push('Solid overall concept with clear value proposition');
  if (ideaType === 'saas' || ideaType === 'tool') strengths.push('Software businesses have high margin potential');
  if (ideaType === 'service') strengths.push('Services can be profitable from customer #1 with no upfront investment');
  if (idea.length > 100) strengths.push('You\'ve thought through the concept in detail — specificity is good');
  strengths.push('You\'re using a proven framework (The Minimalist Entrepreneur) to evaluate');
  
  if (ideaType === 'platform' || ideaType === 'marketplace') risks.push('Two-sided marketplaces have a chicken-and-egg problem — plan your supply acquisition carefully');
  if (overallScore < 50) risks.push('Idea may need more definition — be more specific about who you\'re helping and how');
  risks.push('Validate before building — talk to 10 potential customers before writing code');
  if (ideaType !== 'service') risks.push('Time-to-first-revenue can stretch without discipline — set a hard launch date');
  
  return {
    id: 10,
    title: 'Minimalist Review',
    icon: '🔍',
    color: '#a855f7',
    score: Math.ceil(overallScore / 20),
    insights: [
      `Overall Validator Score: ${overallScore}/100 — ${overallScore >= 75 ? 'Strong concept, ready to build' : overallScore >= 50 ? 'Viable with focused execution' : 'Needs more refinement before building'}`,
      `Top strength: ${strengths[0]}`,
      `Key risk: ${risks[0]}`,
    ],
    actionPrompt: overallScore >= 75 
      ? '🚀 You\'re ready. Ship your MVP this week. Done beats perfect.'
      : overallScore >= 50
        ? '📋 Do 10 customer discovery calls before writing code. Then revisit this score.'
        : '🔍 Go back to Phase 1. Find your community first, then let them tell you what to build.',
    details: 'Every great company started with a fuzzy idea and sharp execution. The framework is a compass, not a GPS.',
  };
}

export function analyzeIdea(idea: string): ValidationResult {
  if (!idea.trim()) {
    return {
      overallScore: 0,
      phases: [],
      strengths: [],
      risks: [],
      nextSteps: [],
      ideaType: 'general',
    };
  }
  
  const ideaType = detectIdeaType(idea);
  const keywords = extractKeywords(idea);
  const specificity = getSpecificityScore(idea);
  
  const phases: PhaseResult[] = [
    getCommunityPhase(idea, ideaType, keywords),
    getProblemPhase(idea, specificity),
    getMVPPhase(ideaType, idea),
    getProcessPhase(ideaType),
    getCustomersPhase(ideaType, keywords),
    getPricingPhase(ideaType, idea),
    getMarketingPhase(idea, keywords, ideaType),
    getGrowthPhase(),
    getCulturePhase(ideaType),
  ];
  
  // Calculate score from phases
  const avgPhaseScore = phases.reduce((sum, p) => sum + p.score, 0) / phases.length;
  const specificityBonus = specificity * 4;
  const overallScore = Math.min(100, Math.round(avgPhaseScore * 15 + specificityBonus));
  
  // Add review phase with calculated score
  phases.push(getReviewPhase(overallScore, idea, ideaType));
  
  const strengths = [
    specificity >= 3 ? 'Well-defined idea with clear target' : 'Entrepreneurial initiative to validate before building',
    ideaType === 'service' || ideaType === 'content' ? 'Low capital requirements to start' : 'Potential for scalable revenue model',
    'Framework-guided approach reduces blind spots',
  ];
  
  const risks = [
    specificity < 3 ? 'Idea needs more specificity — who exactly are you serving?' : 'Execution risk — great ideas fail on follow-through',
    ideaType === 'marketplace' || ideaType === 'platform' ? 'Network effects are hard to bootstrap — nail the supply side first' : 'Customer acquisition cost may exceed lifetime value without retention focus',
    'Building without talking to customers first is the #1 startup killer',
  ];
  
  const nextSteps = [
    'This week: join 3 communities where your target customer hangs out. Don\'t pitch.',
    'Next week: talk to 10 potential customers. Ask about their problem, not your solution.',
    'Week 3: deliver the core value manually to one person. Charge them.',
    'Month 2: automate only what\'s painful to do manually.',
  ];
  
  return {
    overallScore,
    phases,
    strengths,
    risks,
    nextSteps,
    ideaType,
  };
}
