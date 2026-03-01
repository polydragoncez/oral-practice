export interface Passage {
  id: string
  title: string
  text: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  wordCount: number
  keyPoints: string[]
}

export const PASSAGES: Passage[] = [
  // ─── Science ───────────────────────────────────────────────────────
  {
    id: 'water-states',
    title: 'The Three States of Water',
    text: 'Water is a unique substance that exists in three states: solid, liquid, and gas. When water freezes at 0°C, it becomes ice. Unlike most substances, ice is less dense than liquid water, which is why it floats. When water is heated to 100°C, it boils and becomes steam. This property of water is essential for life on Earth, as it allows lakes and oceans to remain liquid beneath a layer of ice during winter, protecting aquatic life.',
    category: 'Science',
    difficulty: 'beginner',
    wordCount: 80,
    keyPoints: [
      'Water exists in three states: solid, liquid, gas',
      'Freezes at 0°C, boils at 100°C',
      'Ice is less dense than liquid water so it floats',
      'This protects aquatic life in winter',
    ],
  },
  {
    id: 'photosynthesis',
    title: 'How Plants Make Food',
    text: 'Photosynthesis is the process by which plants convert sunlight into food. Using chlorophyll, a green pigment in their leaves, plants absorb sunlight and combine carbon dioxide from the air with water from the soil. This produces glucose, which the plant uses for energy and growth, and oxygen, which is released into the atmosphere. Without photosynthesis, there would be almost no oxygen in our atmosphere, and most life on Earth could not exist. This process is also the foundation of nearly all food chains.',
    category: 'Science',
    difficulty: 'intermediate',
    wordCount: 89,
    keyPoints: [
      'Plants convert sunlight into food through photosynthesis',
      'Chlorophyll absorbs sunlight in leaves',
      'Combines CO2 and water to produce glucose and oxygen',
      'Foundation of oxygen in atmosphere',
      'Base of nearly all food chains',
    ],
  },
  {
    id: 'gut-microbiome',
    title: 'The Human Gut Microbiome',
    text: 'The human gut contains trillions of microorganisms collectively known as the gut microbiome. These bacteria, fungi, and viruses play a crucial role in digestion, immune function, and even mental health through what scientists call the gut-brain axis. Research has shown that an imbalanced microbiome is associated with conditions ranging from obesity and diabetes to depression and anxiety. Factors such as diet, antibiotics, and stress can significantly alter the composition of gut bacteria. Emerging therapies, including fecal transplants and targeted probiotics, aim to restore microbial balance and treat disease.',
    category: 'Science',
    difficulty: 'advanced',
    wordCount: 92,
    keyPoints: [
      'Gut contains trillions of microorganisms',
      'Affects digestion, immunity, and mental health via gut-brain axis',
      'Imbalance linked to obesity, diabetes, depression',
      'Diet, antibiotics, stress alter composition',
      'New therapies like fecal transplants aim to restore balance',
    ],
  },

  // ─── Technology ────────────────────────────────────────────────────
  {
    id: 'how-gps-works',
    title: 'How GPS Works',
    text: 'The Global Positioning System, or GPS, uses a network of at least 24 satellites orbiting Earth to help people determine their exact location. Your GPS device receives signals from multiple satellites and calculates the distance to each one based on how long the signal takes to arrive. By comparing distances from at least four satellites, the device can pinpoint your position with remarkable accuracy. GPS technology is used in navigation, mapping, farming, and even tracking wildlife.',
    category: 'Technology',
    difficulty: 'beginner',
    wordCount: 81,
    keyPoints: [
      'Uses at least 24 satellites orbiting Earth',
      'Device calculates distance based on signal travel time',
      'Needs at least four satellites for accurate positioning',
      'Used in navigation, mapping, farming, wildlife tracking',
    ],
  },
  {
    id: 'blockchain-basics',
    title: 'Understanding Blockchain',
    text: 'Blockchain is a distributed digital ledger that records transactions across many computers so that no single entity controls the data. Each block contains a set of transactions and a cryptographic hash of the previous block, creating an unbreakable chain. Once data is recorded, it cannot be altered without changing every subsequent block, making the system highly secure. Originally developed for Bitcoin, blockchain technology now has applications in supply chain management, healthcare records, voting systems, and digital identity verification.',
    category: 'Technology',
    difficulty: 'intermediate',
    wordCount: 83,
    keyPoints: [
      'Distributed ledger across many computers, no single entity controls it',
      'Blocks contain transactions and hash of previous block',
      'Data cannot be altered without changing all subsequent blocks',
      'Originally for Bitcoin, now used in supply chain, healthcare, voting',
    ],
  },
  {
    id: 'quantum-computing',
    title: 'Quantum Computing Explained',
    text: 'Quantum computers leverage the principles of quantum mechanics to process information in fundamentally different ways than classical computers. While traditional computers use bits that are either 0 or 1, quantum computers use qubits that can exist in a superposition of both states simultaneously. This allows them to explore multiple solutions at once, making them potentially millions of times faster for certain problems such as cryptography, drug discovery, and optimization. However, qubits are extremely fragile and require near-absolute-zero temperatures to maintain their quantum state, presenting significant engineering challenges.',
    category: 'Technology',
    difficulty: 'advanced',
    wordCount: 96,
    keyPoints: [
      'Uses quantum mechanics principles unlike classical computers',
      'Qubits can be 0 and 1 simultaneously (superposition)',
      'Explores multiple solutions at once',
      'Potentially millions of times faster for cryptography, drug discovery',
      'Qubits are fragile, need near-absolute-zero temperatures',
    ],
  },

  // ─── Culture ───────────────────────────────────────────────────────
  {
    id: 'coffee-history',
    title: 'The Origins of Coffee',
    text: 'Coffee was first discovered in Ethiopia around the 9th century when a goat herder named Kaldi noticed his goats became unusually energetic after eating berries from a certain tree. He shared his discovery with local monks, who found that a drink made from the berries helped them stay alert during long hours of prayer. By the 15th century, coffee was being cultivated in Yemen, and coffeehouses soon spread across the Middle East, becoming centers of social activity and intellectual exchange. Today, coffee is one of the most traded commodities in the world, with over 2 billion cups consumed daily.',
    category: 'Culture',
    difficulty: 'beginner',
    wordCount: 107,
    keyPoints: [
      'Discovered in Ethiopia around 9th century',
      'Goat herder Kaldi noticed energetic goats',
      'Monks used it to stay alert during prayer',
      'Cultivated in Yemen by 15th century',
      'Now one of most traded commodities globally',
    ],
  },
  {
    id: 'origami',
    title: 'The Art of Origami',
    text: 'Origami, the Japanese art of paper folding, has evolved from a ceremonial practice into a global art form with applications in science and engineering. Traditional origami uses a single square sheet of paper without cutting or gluing. Modern origami artists create incredibly complex designs, from realistic animals to geometric structures. Scientists have applied origami principles to design solar panels that fold compactly for space launches, airbags that deploy efficiently, and medical stents that expand inside blood vessels. The mathematical principles behind origami continue to inspire innovations across multiple disciplines.',
    category: 'Culture',
    difficulty: 'intermediate',
    wordCount: 92,
    keyPoints: [
      'Japanese art of paper folding, evolved from ceremonial practice',
      'Traditional: single square sheet, no cutting or gluing',
      'Modern artists create complex realistic designs',
      'Applied in science: solar panels, airbags, medical stents',
      'Mathematical principles inspire cross-discipline innovation',
    ],
  },

  // ─── Health ────────────────────────────────────────────────────────
  {
    id: 'sleep-importance',
    title: 'Why Sleep Matters',
    text: 'Getting enough sleep is just as important as eating well and exercising. During sleep, your body repairs muscles, consolidates memories, and releases important hormones. Adults need seven to nine hours of sleep each night. Not getting enough sleep can lead to weight gain, a weaker immune system, and difficulty concentrating. To improve sleep quality, experts recommend keeping a regular schedule, avoiding screens before bedtime, and keeping your bedroom cool and dark.',
    category: 'Health',
    difficulty: 'beginner',
    wordCount: 80,
    keyPoints: [
      'As important as diet and exercise',
      'Body repairs muscles, consolidates memories, releases hormones during sleep',
      'Adults need 7-9 hours per night',
      'Sleep deprivation causes weight gain, weak immunity, poor concentration',
      'Tips: regular schedule, no screens, cool dark room',
    ],
  },
  {
    id: 'intermittent-fasting',
    title: 'Intermittent Fasting',
    text: 'Intermittent fasting is an eating pattern that cycles between periods of fasting and eating. The most popular method is the 16:8 approach, where people eat within an eight-hour window and fast for sixteen hours. Research suggests that intermittent fasting may help with weight loss, improve insulin sensitivity, and reduce inflammation. During fasting periods, the body begins a cellular repair process called autophagy, where cells remove damaged components. However, this approach is not suitable for everyone, particularly pregnant women, children, and people with certain medical conditions.',
    category: 'Health',
    difficulty: 'intermediate',
    wordCount: 94,
    keyPoints: [
      'Cycles between fasting and eating periods',
      'Popular 16:8 method: eat in 8 hours, fast for 16',
      'May aid weight loss, improve insulin sensitivity, reduce inflammation',
      'Fasting triggers autophagy (cellular repair)',
      'Not suitable for pregnant women, children, or certain conditions',
    ],
  },
  {
    id: 'neuroplasticity',
    title: 'Neuroplasticity and the Aging Brain',
    text: 'Contrary to the long-held belief that the adult brain is fixed and unchangeable, neuroscience research has demonstrated remarkable neuroplasticity throughout the human lifespan. The brain continuously forms new neural connections in response to learning, experience, and environmental stimulation. Studies of London taxi drivers revealed that their hippocampi, the brain region responsible for spatial memory, were significantly larger than average due to years of navigating complex routes. This discovery has profound implications for rehabilitation after stroke, treatment of neurodegenerative diseases, and strategies for maintaining cognitive function in old age.',
    category: 'Health',
    difficulty: 'advanced',
    wordCount: 95,
    keyPoints: [
      'Adult brain is not fixed — shows neuroplasticity throughout life',
      'Brain forms new neural connections from learning and experience',
      'London taxi drivers had larger hippocampi from navigation',
      'Implications for stroke rehabilitation and neurodegenerative disease',
      'Strategies for maintaining cognition in old age',
    ],
  },

  // ─── Environment ───────────────────────────────────────────────────
  {
    id: 'coral-reefs',
    title: 'Coral Reefs in Danger',
    text: 'Coral reefs are often called the rainforests of the sea because they support about 25% of all marine species despite covering less than 1% of the ocean floor. However, rising ocean temperatures caused by climate change are leading to coral bleaching, a process where corals expel the algae living in their tissues and turn white. Without these algae, corals lose their main food source and often die. Scientists estimate that 70-90% of the world\'s coral reefs could disappear within the next 30 years if global temperatures continue to rise at current rates.',
    category: 'Environment',
    difficulty: 'intermediate',
    wordCount: 100,
    keyPoints: [
      'Support 25% of marine species, cover less than 1% of ocean floor',
      'Called rainforests of the sea',
      'Rising temperatures cause coral bleaching',
      'Bleaching: corals expel algae, lose food source, often die',
      '70-90% could disappear in 30 years at current rates',
    ],
  },
  {
    id: 'fast-fashion-env',
    title: 'The Environmental Cost of Fast Fashion',
    text: 'The fast fashion industry produces approximately 92 million tons of textile waste annually and is responsible for about 10% of global carbon emissions. The production of a single cotton T-shirt requires roughly 2,700 liters of water, equivalent to what one person drinks over two and a half years. Synthetic fabrics like polyester shed microplastics during washing, which eventually reach the ocean and enter the food chain. Growing consumer awareness has led to the rise of sustainable fashion movements, including clothing rental services, secondhand platforms, and brands committed to circular production models.',
    category: 'Environment',
    difficulty: 'intermediate',
    wordCount: 97,
    keyPoints: [
      'Produces 92 million tons of textile waste per year',
      'Responsible for ~10% of global carbon emissions',
      'One T-shirt needs 2,700 liters of water',
      'Synthetic fabrics shed microplastics into oceans',
      'Sustainable movements: rental, secondhand, circular production',
    ],
  },
  {
    id: 'biodiversity-loss',
    title: 'The Sixth Mass Extinction',
    text: 'Scientists warn that Earth is experiencing its sixth mass extinction event, driven primarily by human activities including habitat destruction, pollution, climate change, and overexploitation of natural resources. Species are disappearing at a rate estimated to be 1,000 times higher than the natural background extinction rate. The consequences extend far beyond the loss of individual species; collapsing ecosystems threaten food security, water purification, disease regulation, and climate stability. Conservation strategies such as establishing protected areas, restoring degraded habitats, and implementing stricter wildlife trade regulations are considered essential to slowing this unprecedented biodiversity crisis.',
    category: 'Environment',
    difficulty: 'advanced',
    wordCount: 97,
    keyPoints: [
      'Earth experiencing sixth mass extinction driven by humans',
      'Species disappearing 1,000 times faster than natural rate',
      'Caused by habitat destruction, pollution, climate change, overexploitation',
      'Threatens food security, water purification, climate stability',
      'Conservation: protected areas, habitat restoration, trade regulations',
    ],
  },

  // ─── Business ──────────────────────────────────────────────────────
  {
    id: 'remote-work-shift',
    title: 'The Rise of Remote Work',
    text: 'Remote work has transformed from a rare perk into a standard practice for millions of workers worldwide. Companies have discovered that many employees are equally or more productive working from home, while saving on office space costs. Workers benefit from eliminating commutes, gaining schedule flexibility, and achieving better work-life balance. However, challenges remain, including feelings of isolation, difficulty separating work from personal life, and reduced opportunities for spontaneous collaboration. Many organizations are now adopting hybrid models that combine the benefits of both remote and in-office work.',
    category: 'Business',
    difficulty: 'beginner',
    wordCount: 92,
    keyPoints: [
      'Shifted from rare perk to standard practice',
      'Employees often equally or more productive at home',
      'Benefits: no commute, flexibility, work-life balance',
      'Challenges: isolation, blurred boundaries, less spontaneous collaboration',
      'Hybrid models combining remote and office becoming popular',
    ],
  },
  {
    id: 'subscription-economy',
    title: 'The Subscription Economy',
    text: 'The subscription business model has expanded well beyond magazines and newspapers into virtually every industry. From streaming services and software to meal kits and clothing rentals, consumers increasingly prefer paying recurring fees for access rather than owning products outright. This shift benefits companies through predictable revenue streams and deeper customer relationships, while consumers enjoy lower upfront costs and greater flexibility. However, subscription fatigue is emerging as consumers struggle to manage dozens of monthly payments. Research shows the average American now spends over $200 per month on subscriptions, often forgetting about services they rarely use.',
    category: 'Business',
    difficulty: 'intermediate',
    wordCount: 101,
    keyPoints: [
      'Expanded beyond media into virtually every industry',
      'Consumers prefer access over ownership with recurring fees',
      'Companies benefit from predictable revenue and deeper relationships',
      'Subscription fatigue emerging from too many subscriptions',
      'Average American spends $200+/month, often on forgotten services',
    ],
  },

  // ─── History ───────────────────────────────────────────────────────
  {
    id: 'printing-press',
    title: 'The Printing Press Revolution',
    text: 'Johannes Gutenberg\'s invention of the movable-type printing press around 1440 is considered one of the most important events in human history. Before the printing press, books were copied by hand, making them expensive and rare. Gutenberg\'s invention made it possible to produce books quickly and cheaply. Within fifty years, millions of books were in circulation across Europe. This led to a dramatic increase in literacy, helped spread new ideas during the Renaissance and Reformation, and laid the foundation for modern mass communication and education.',
    category: 'History',
    difficulty: 'beginner',
    wordCount: 90,
    keyPoints: [
      'Gutenberg invented movable-type printing press around 1440',
      'Before: books copied by hand, expensive and rare',
      'Made book production fast and cheap',
      'Millions of books in circulation within 50 years',
      'Increased literacy, spread Renaissance/Reformation ideas',
    ],
  },
  {
    id: 'silk-road',
    title: 'The Silk Road',
    text: 'The Silk Road was an ancient network of trade routes connecting China to the Mediterranean, spanning over 6,400 kilometers. Established during the Han Dynasty around 130 BCE, it facilitated the exchange of not only silk and spices but also ideas, religions, and technologies between East and West. Buddhist monks, Muslim traders, and Christian missionaries all traveled these routes, creating a remarkable cultural exchange. The Silk Road also inadvertently spread diseases, including the Black Death, which devastated Europe in the 14th century. The routes declined after sea trade became more efficient in the 15th century.',
    category: 'History',
    difficulty: 'intermediate',
    wordCount: 101,
    keyPoints: [
      'Ancient trade network from China to Mediterranean, 6,400+ km',
      'Established during Han Dynasty around 130 BCE',
      'Exchanged goods, ideas, religions, and technologies',
      'Also spread diseases including the Black Death',
      'Declined when sea trade became more efficient in 15th century',
    ],
  },

  // ─── Psychology ────────────────────────────────────────────────────
  {
    id: 'dunning-kruger',
    title: 'The Dunning-Kruger Effect',
    text: 'The Dunning-Kruger effect is a cognitive bias where people with limited knowledge or skill in a particular area tend to overestimate their own competence. Conversely, experts often underestimate their abilities, assuming that tasks they find easy must be easy for everyone. This phenomenon was first described by psychologists David Dunning and Justin Kruger in 1999. It explains why beginners often feel very confident while experienced professionals express doubt. Understanding this effect is valuable in education, workplace management, and self-improvement, as it encourages a more humble and accurate assessment of one\'s own abilities.',
    category: 'Psychology',
    difficulty: 'intermediate',
    wordCount: 100,
    keyPoints: [
      'People with limited skill overestimate their competence',
      'Experts tend to underestimate their abilities',
      'Described by Dunning and Kruger in 1999',
      'Beginners feel confident, experts express doubt',
      'Useful in education, management, and self-improvement',
    ],
  },
  {
    id: 'sunk-cost-fallacy',
    title: 'The Sunk Cost Fallacy',
    text: 'The sunk cost fallacy is a psychological tendency to continue investing in something because of the resources already spent, rather than evaluating future value. For example, a person might finish watching a terrible movie simply because they paid for the ticket, or a company might continue funding a failing project because millions have already been invested. Rational decision-making requires ignoring past costs and focusing only on future benefits. However, emotional attachment and the desire to avoid feeling wasteful make this extremely difficult. Recognizing this fallacy can improve decisions in business, relationships, and personal finance.',
    category: 'Psychology',
    difficulty: 'intermediate',
    wordCount: 100,
    keyPoints: [
      'Tendency to continue investing due to past resources spent',
      'Example: finishing bad movie because ticket was paid for',
      'Rational decisions should ignore past costs, focus on future value',
      'Emotional attachment makes it hard to abandon investments',
      'Recognizing it improves business, relationship, and financial decisions',
    ],
  },
  {
    id: 'cognitive-dissonance',
    title: 'Cognitive Dissonance Theory',
    text: 'Cognitive dissonance, a concept introduced by psychologist Leon Festinger in 1957, describes the mental discomfort experienced when holding two contradictory beliefs or when behavior conflicts with personal values. To reduce this discomfort, individuals typically employ one of three strategies: changing their behavior, changing their beliefs, or rationalizing the inconsistency. For instance, a smoker who knows smoking is harmful might quit, deny the health risks, or convince themselves that the pleasure outweighs the danger. This theory has profoundly influenced our understanding of attitude change, decision-making processes, and the mechanisms underlying self-justification in everyday life.',
    category: 'Psychology',
    difficulty: 'advanced',
    wordCount: 103,
    keyPoints: [
      'Introduced by Festinger in 1957',
      'Mental discomfort from holding contradictory beliefs',
      'Three coping strategies: change behavior, change beliefs, or rationalize',
      'Smoker example illustrates all three strategies',
      'Influenced understanding of attitude change and self-justification',
    ],
  },
]

export const PASSAGE_CATEGORIES = [...new Set(PASSAGES.map((p) => p.category))]
export const PASSAGE_DIFFICULTIES: Passage['difficulty'][] = ['beginner', 'intermediate', 'advanced']
