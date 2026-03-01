export interface Question {
  id: string
  question: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  followUp: string
}

export const QUESTIONS: Question[] = [
  // Travel
  { id: 't1', question: 'What is the best trip you have ever taken?', category: 'Travel', difficulty: 'beginner', followUp: 'What made it so memorable?' },
  { id: 't2', question: 'If you could visit any country in the world, where would you go and why?', category: 'Travel', difficulty: 'beginner', followUp: 'What would you do there?' },
  { id: 't3', question: 'Do you prefer traveling alone or with others? Explain your preference.', category: 'Travel', difficulty: 'intermediate', followUp: 'Has your preference changed over time?' },
  { id: 't4', question: 'How has tourism changed the way people experience different cultures?', category: 'Travel', difficulty: 'advanced', followUp: 'Is this change positive or negative?' },
  { id: 't5', question: 'Describe a time when you got lost while traveling. What happened?', category: 'Travel', difficulty: 'intermediate', followUp: 'What did you learn from the experience?' },
  { id: 't6', question: 'What are the advantages and disadvantages of budget travel?', category: 'Travel', difficulty: 'intermediate', followUp: 'Would you recommend it to others?' },

  // Technology
  { id: 'te1', question: 'How has technology changed the way you communicate with others?', category: 'Technology', difficulty: 'beginner', followUp: 'Is this change mostly positive?' },
  { id: 'te2', question: 'Do you think artificial intelligence will replace many jobs in the future?', category: 'Technology', difficulty: 'intermediate', followUp: 'How should society prepare for this?' },
  { id: 'te3', question: 'Should children be limited in how much screen time they have? Why or why not?', category: 'Technology', difficulty: 'intermediate', followUp: 'What age is appropriate for a first smartphone?' },
  { id: 'te4', question: 'How do you think social media affects mental health?', category: 'Technology', difficulty: 'intermediate', followUp: 'What can be done to reduce negative effects?' },
  { id: 'te5', question: 'What technological invention has had the biggest impact on human history?', category: 'Technology', difficulty: 'advanced', followUp: 'Why do you think so?' },
  { id: 'te6', question: 'Should governments regulate big tech companies more strictly?', category: 'Technology', difficulty: 'advanced', followUp: 'What specific regulations would you support?' },

  // Education
  { id: 'e1', question: 'What was your favorite subject in school and why?', category: 'Education', difficulty: 'beginner', followUp: 'How has it influenced your life?' },
  { id: 'e2', question: 'Do you think online learning is as effective as in-person classes?', category: 'Education', difficulty: 'intermediate', followUp: 'What improvements would you suggest?' },
  { id: 'e3', question: 'Should university education be free for everyone?', category: 'Education', difficulty: 'advanced', followUp: 'How would you fund such a system?' },
  { id: 'e4', question: 'What skill do you wish you had learned earlier in life?', category: 'Education', difficulty: 'beginner', followUp: 'Why is this skill important to you?' },
  { id: 'e5', question: 'How should schools prepare students for the modern job market?', category: 'Education', difficulty: 'advanced', followUp: 'What changes would you make to the curriculum?' },
  { id: 'e6', question: 'Is homework beneficial for students or just a waste of time?', category: 'Education', difficulty: 'intermediate', followUp: 'What alternatives would you suggest?' },

  // Work
  { id: 'w1', question: 'What is your dream job and why?', category: 'Work', difficulty: 'beginner', followUp: 'What steps are you taking to achieve it?' },
  { id: 'w2', question: 'Do you prefer working from home or in an office? Why?', category: 'Work', difficulty: 'beginner', followUp: 'What are the challenges of your preferred option?' },
  { id: 'w3', question: 'How important is work-life balance to you?', category: 'Work', difficulty: 'intermediate', followUp: 'What do you do to maintain it?' },
  { id: 'w4', question: 'Should companies implement a four-day work week?', category: 'Work', difficulty: 'intermediate', followUp: 'What would be the potential drawbacks?' },
  { id: 'w5', question: 'How has the gig economy changed the nature of employment?', category: 'Work', difficulty: 'advanced', followUp: 'Is this trend sustainable long-term?' },
  { id: 'w6', question: 'What qualities make someone a good leader in the workplace?', category: 'Work', difficulty: 'intermediate', followUp: 'Can leadership skills be learned?' },

  // Health
  { id: 'h1', question: 'What do you do to stay healthy?', category: 'Health', difficulty: 'beginner', followUp: 'How has your routine changed over the years?' },
  { id: 'h2', question: 'Do you think mental health is as important as physical health?', category: 'Health', difficulty: 'intermediate', followUp: 'How can society better support mental health?' },
  { id: 'h3', question: 'Should junk food advertising be banned?', category: 'Health', difficulty: 'intermediate', followUp: 'What other measures could improve public health?' },
  { id: 'h4', question: 'How has the pandemic changed your views on healthcare?', category: 'Health', difficulty: 'advanced', followUp: 'What lessons should we take forward?' },
  { id: 'h5', question: 'What is the most important thing people can do to live longer?', category: 'Health', difficulty: 'beginner', followUp: 'Do you follow your own advice?' },

  // Environment
  { id: 'en1', question: 'What small things can individuals do to help the environment?', category: 'Environment', difficulty: 'beginner', followUp: 'Do you practice any of these habits?' },
  { id: 'en2', question: 'Should governments ban single-use plastics?', category: 'Environment', difficulty: 'intermediate', followUp: 'What would be the economic impact?' },
  { id: 'en3', question: 'Is climate change the biggest challenge facing humanity today?', category: 'Environment', difficulty: 'advanced', followUp: 'What should be done about it?' },
  { id: 'en4', question: 'Do you think electric cars will completely replace gasoline cars?', category: 'Environment', difficulty: 'intermediate', followUp: 'What barriers exist to widespread adoption?' },
  { id: 'en5', question: 'Should companies be legally required to reduce their carbon footprint?', category: 'Environment', difficulty: 'advanced', followUp: 'How would you enforce such regulations?' },

  // Culture
  { id: 'c1', question: 'What is a tradition from your culture that you really enjoy?', category: 'Culture', difficulty: 'beginner', followUp: 'How is this tradition celebrated?' },
  { id: 'c2', question: 'How has globalization affected local cultures around the world?', category: 'Culture', difficulty: 'advanced', followUp: 'Is cultural preservation important?' },
  { id: 'c3', question: 'What is the best book, movie, or TV show you have experienced recently?', category: 'Culture', difficulty: 'beginner', followUp: 'What made it so good?' },
  { id: 'c4', question: 'Should museums return artifacts to their countries of origin?', category: 'Culture', difficulty: 'advanced', followUp: 'Who should decide ownership?' },
  { id: 'c5', question: 'How important is it to learn about other cultures?', category: 'Culture', difficulty: 'intermediate', followUp: 'What is the best way to learn about them?' },

  // Hypothetical
  { id: 'hy1', question: 'If you could have dinner with any person, living or dead, who would it be?', category: 'Hypothetical', difficulty: 'beginner', followUp: 'What would you talk about?' },
  { id: 'hy2', question: 'If you could change one thing about the world, what would it be?', category: 'Hypothetical', difficulty: 'intermediate', followUp: 'How would this change affect society?' },
  { id: 'hy3', question: 'If you woke up tomorrow with a superpower, what would you choose and why?', category: 'Hypothetical', difficulty: 'beginner', followUp: 'How would you use this power?' },
  { id: 'hy4', question: 'If you could live in any historical period, when would you choose?', category: 'Hypothetical', difficulty: 'intermediate', followUp: 'What would you find most challenging?' },
  { id: 'hy5', question: 'If money were no object, how would you spend your time?', category: 'Hypothetical', difficulty: 'beginner', followUp: 'Would you still work?' },
  { id: 'hy6', question: 'If you could instantly become an expert in something, what would you choose?', category: 'Hypothetical', difficulty: 'intermediate', followUp: 'How would you apply this expertise?' },

  // Personal
  { id: 'p1', question: 'What are you most proud of in your life so far?', category: 'Personal', difficulty: 'beginner', followUp: 'Why is this achievement meaningful to you?' },
  { id: 'p2', question: 'Describe a challenge you have overcome. What did you learn?', category: 'Personal', difficulty: 'intermediate', followUp: 'How has it shaped who you are today?' },
  { id: 'p3', question: 'What advice would you give to your younger self?', category: 'Personal', difficulty: 'intermediate', followUp: 'Do you think your younger self would listen?' },
  { id: 'p4', question: 'What motivates you to keep learning and improving?', category: 'Personal', difficulty: 'beginner', followUp: 'How do you stay motivated when things get difficult?' },
  { id: 'p5', question: 'How do you handle stress or difficult situations?', category: 'Personal', difficulty: 'intermediate', followUp: 'Has your approach changed over time?' },
  { id: 'p6', question: 'What does success mean to you personally?', category: 'Personal', difficulty: 'advanced', followUp: 'Has your definition changed as you have gotten older?' },
]

export const CATEGORIES = [...new Set(QUESTIONS.map((q) => q.category))]
export const DIFFICULTIES: Question['difficulty'][] = ['beginner', 'intermediate', 'advanced']
