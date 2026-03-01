export interface DebateTopic {
  id: string
  topic: string
  category: string
  proHint: string
  conHint: string
}

export const DEBATE_TOPICS: DebateTopic[] = [
  // Work
  { id: 'w1', topic: 'Remote work should become the default for all office jobs.', category: 'Work', proHint: 'Flexibility, no commute, work-life balance, global talent pool', conHint: 'Isolation, communication challenges, blurred boundaries, not all roles fit' },
  { id: 'w2', topic: 'A four-day work week would benefit both employees and companies.', category: 'Work', proHint: 'Higher productivity, better well-being, less burnout, talent attraction', conHint: 'Customer service gaps, harder coordination, may not suit all industries' },
  { id: 'w3', topic: 'Employees should be paid based on performance, not hours worked.', category: 'Work', proHint: 'Rewards productivity, motivates excellence, fair compensation', conHint: 'Subjectivity in measurement, team vs individual, stress and burnout' },
  { id: 'w4', topic: 'Companies should require employees to return to the office.', category: 'Work', proHint: 'Collaboration, company culture, mentorship, spontaneous ideas', conHint: 'Commute costs, reduced flexibility, proven remote productivity' },

  // Technology
  { id: 't1', topic: 'Social media does more harm than good to society.', category: 'Technology', proHint: 'Mental health issues, misinformation, addiction, privacy concerns', conHint: 'Connection, awareness, business opportunities, community building' },
  { id: 't2', topic: 'AI should be regulated by governments before it advances further.', category: 'Technology', proHint: 'Safety, job displacement prevention, ethical use, accountability', conHint: 'Stifles innovation, hard to regulate globally, slows progress' },
  { id: 't3', topic: 'Children under 14 should not have smartphones.', category: 'Technology', proHint: 'Protects development, reduces cyberbullying, better focus', conHint: 'Safety tool, digital literacy, social inclusion, parental controls exist' },
  { id: 't4', topic: 'Cryptocurrency will eventually replace traditional banking.', category: 'Technology', proHint: 'Decentralization, lower fees, financial inclusion, transparency', conHint: 'Volatility, energy consumption, lack of regulation, complexity' },
  { id: 't5', topic: 'Self-driving cars should replace human drivers on public roads.', category: 'Technology', proHint: 'Fewer accidents, efficiency, accessibility for disabled, less traffic', conHint: 'Technology not ready, job losses, ethical dilemmas, hacking risks' },

  // Education
  { id: 'e1', topic: 'University degrees are no longer necessary for career success.', category: 'Education', proHint: 'Skills matter more, self-learning resources, successful dropouts, cost', conHint: 'Structured learning, networking, credential requirements, research access' },
  { id: 'e2', topic: 'Standardized testing should be abolished.', category: 'Education', proHint: 'Does not measure true ability, causes stress, favors memorization', conHint: 'Objective measurement, accountability, college admissions fairness' },
  { id: 'e3', topic: 'Schools should teach financial literacy as a mandatory subject.', category: 'Education', proHint: 'Practical life skill, debt prevention, better financial decisions', conHint: 'Overcrowded curriculum, parents should teach, age-appropriate concerns' },
  { id: 'e4', topic: 'Students should be allowed to choose all their own subjects.', category: 'Education', proHint: 'Engagement, passion-driven learning, individual strengths', conHint: 'Knowledge gaps, immature choices, need for well-rounded education' },

  // Environment
  { id: 'en1', topic: 'Meat consumption should be heavily taxed to fight climate change.', category: 'Environment', proHint: 'Reduces emissions, promotes alternatives, health benefits, land use', conHint: 'Regressive tax, cultural importance, personal freedom, farmer livelihoods' },
  { id: 'en2', topic: 'Nuclear energy is the best solution to the climate crisis.', category: 'Environment', proHint: 'Low emissions, reliable baseload, small land footprint, modern safety', conHint: 'Waste disposal, disaster risk, high costs, long construction time' },
  { id: 'en3', topic: 'Fast fashion should be banned to protect the environment.', category: 'Environment', proHint: 'Pollution reduction, worker rights, less waste, quality over quantity', conHint: 'Affordable clothing access, job losses, hard to enforce, consumer choice' },
  { id: 'en4', topic: 'Every country should set a net-zero carbon target by 2040.', category: 'Environment', proHint: 'Urgent action needed, technological innovation incentive, public health', conHint: 'Economic burden on developing nations, unrealistic timeline, energy security' },

  // Health
  { id: 'h1', topic: 'Healthcare should be completely free and government-funded.', category: 'Health', proHint: 'Universal access, reduced inequality, preventive care, basic human right', conHint: 'Higher taxes, longer wait times, lower quality, government inefficiency' },
  { id: 'h2', topic: 'Junk food advertising should be completely banned.', category: 'Health', proHint: 'Protects children, reduces obesity, public health savings', conHint: 'Free speech, personal responsibility, economic impact, hard to define' },
  { id: 'h3', topic: 'Mental health days should be legally required for all workers.', category: 'Health', proHint: 'Reduces burnout, improves productivity, destigmatizes mental health', conHint: 'Abuse potential, business costs, hard to verify, existing sick leave' },

  // Lifestyle
  { id: 'l1', topic: 'Living in a big city is better than living in the countryside.', category: 'Lifestyle', proHint: 'Career opportunities, culture, convenience, social life, healthcare', conHint: 'Cost of living, pollution, stress, lack of nature, noise' },
  { id: 'l2', topic: 'People should prioritize experiences over material possessions.', category: 'Lifestyle', proHint: 'Lasting memories, personal growth, less clutter, happiness research', conHint: 'Practical needs, investment value, comfort, security' },
  { id: 'l3', topic: 'Everyone should learn to cook instead of relying on restaurants.', category: 'Lifestyle', proHint: 'Healthier, cheaper, life skill, creative outlet, dietary control', conHint: 'Time constraints, restaurant economy, social dining, not everyone enjoys it' },

  // Society
  { id: 's1', topic: 'Voting should be mandatory for all citizens.', category: 'Society', proHint: 'Higher participation, representative democracy, civic duty', conHint: 'Freedom of choice, uninformed voting, enforcement difficulty' },
  { id: 's2', topic: 'The death penalty should be abolished worldwide.', category: 'Society', proHint: 'Risk of error, human rights, no deterrence evidence, rehabilitation', conHint: 'Justice for victims, deterrence argument, public safety, cost of life imprisonment' },
  { id: 's3', topic: 'Immigration benefits the economy more than it costs.', category: 'Society', proHint: 'Labor force growth, innovation, cultural diversity, tax contributions', conHint: 'Job competition, public service strain, integration challenges, wage depression' },
  { id: 's4', topic: 'Privacy is more important than national security.', category: 'Society', proHint: 'Fundamental right, government overreach, chilling effect on free speech', conHint: 'Terrorism prevention, crime detection, public safety, nothing to hide argument' },
]

export const DEBATE_CATEGORIES = [...new Set(DEBATE_TOPICS.map((t) => t.category))]
