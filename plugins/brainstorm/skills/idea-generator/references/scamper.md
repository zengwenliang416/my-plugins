# SCAMPER Creative Divergence Method

## Method Overview

SCAMPER is a systematic creative divergence technique that stimulates new ideas through seven thinking perspectives. Each letter represents a thinking approach:

| Letter | English               | Chinese   | Core Question                         |
| ------ | --------------------- | --------- | ------------------------------------- |
| S      | Substitute            | Replace   | What can be substituted?              |
| C      | Combine               | Combine   | What can be combined?                 |
| A      | Adapt                 | Adapt     | What can be borrowed from?            |
| M      | Modify/Magnify/Minify | Modify    | What can be enlarged/reduced/changed? |
| P      | Put to other uses     | Repurpose | Where else can it be used?            |
| E      | Eliminate             | Eliminate | What can be removed?                  |
| R      | Reverse/Rearrange     | Reverse   | What can be reversed/rearranged?      |

## Detailed Dimensions and Question Templates

### S - Substitute

**Core Concept**: Replace existing components with other elements

**Question Checklist**:

- What materials/components/personnel can be substituted?
- What processes/methods can be substituted?
- What technologies/tools can be substituted?
- What rules/assumptions can be changed?
- What other products/services can be substituted?

**Examples**:

- Replace human customer service with AI
- Replace one-time purchase with subscription model
- Replace meetings with asynchronous communication

### C - Combine

**Core Concept**: Merge different elements to create new value

**Question Checklist**:

- What features/services can be combined?
- What user groups/needs can be merged to serve?
- What technologies/methods can be integrated?
- What resources/channels can be consolidated?
- What styles/experiences can be mixed?

**Examples**:

- Fitness + Social -> Sports community
- Payment + Investment -> Yu'ebao (money market fund)
- Navigation + Music -> Driving experience

### A - Adapt

**Core Concept**: Borrow successful experiences from other domains

**Question Checklist**:

- How do other industries solve similar problems?
- What historical success stories can be referenced?
- What similar mechanisms exist in nature?
- How do other cultures/regions do it?
- What competitor practices are worth learning?

**Examples**:

- Apply gamification to improve learning engagement
- Borrow membership systems from the hotel industry
- Adopt iterative thinking from biological evolution

### M - Modify/Magnify/Minify

**Core Concept**: Change the degree or form of attributes

**Question Checklist**:

- What features/functions can be magnified?
- What costs/complexity can be minimized?
- What can be sped up/slowed down?
- What intensity can be strengthened/weakened?
- What shapes/colors/sounds can be changed?

**Examples**:

- Magnify: Make buttons bigger and more prominent
- Minimize: Simplify features to the extreme (MVP)
- Modify: Change from text to voice interaction

### P - Put to other uses

**Core Concept**: Discover new uses for existing resources

**Question Checklist**:

- What other problems can existing capabilities solve?
- What other needs do existing users have?
- What other value can existing data generate?
- Who else can existing channels reach?
- What new products can byproducts become?

**Examples**:

- Map data -> Urban planning services
- E-commerce reviews -> Market research data
- Logistics network -> On-demand delivery services

### E - Eliminate

**Core Concept**: Create value through subtraction

**Question Checklist**:

- What steps/processes can be eliminated?
- What features/characteristics can be removed?
- What intermediary steps can be skipped?
- What restrictions/rules can be canceled?
- What do users truly not need?

**Examples**:

- Disintermediation (Uber, Airbnb)
- Passwordless login
- One-click ordering (skip the shopping cart)

### R - Reverse/Rearrange

**Core Concept**: Reverse order or think from a different perspective

**Question Checklist**:

- What sequence/process can be reversed?
- What roles/positions can be swapped?
- Can we work backward from results to process?
- What if we did it the opposite way?
- Can users and providers be interchanged?

**Examples**:

- Try before buy -> Buy then try and return
- Company recruits people -> People choose companies
- Fixed pricing -> Dynamic pricing

## Codex Prompt Template

```
As a backend architect and technical expert, use the SCAMPER method to generate ideas for the following topic:

Topic: {topic}
Research Background: {research_brief_summary}

For each SCAMPER dimension, generate 2-3 ideas from the perspectives of technical feasibility, system architecture, and data modeling:

1. Substitute: What technologies/components/processes can be substituted?
2. Combine: What features/services/data can be combined?
3. Adapt: What technical patterns from other domains can be borrowed?
4. Modify: How can performance/scale/complexity be adjusted?
5. Put to other uses: What other problems can existing technical capabilities solve?
6. Eliminate: What steps/dependencies can be simplified or removed?
7. Reverse: Can processes/data flows/architecture be reversed?

For each idea, include:
- Idea title
- Brief description (2-3 sentences)
- Technical complexity (1-5 points)
- Estimated implementation timeline (short-term <1 week/medium-term 1-4 weeks/long-term >1 month)
- Key technical dependencies

Output in JSON format:
[
  {
    "id": "S-1",
    "dimension": "Substitute",
    "title": "...",
    "description": "...",
    "technical_complexity": 3,
    "timeline": "medium-term",
    "dependencies": ["..."],
    "source": "codex"
  }
]
```

## Gemini Prompt Template

```
As a creative designer and user experience expert, use the SCAMPER method to generate ideas for the following topic:

Topic: {topic}
Research Background: {research_brief_summary}

For each SCAMPER dimension, generate 2-3 ideas from the perspectives of user experience, emotional value, and innovation:

1. Substitute: What user needs can be met in new ways?
2. Combine: What experiences can be merged to create delight?
3. Adapt: What experience designs from other industries can be borrowed?
4. Modify: How can interaction/visual/emotional experience be enhanced?
5. Put to other uses: What other scenarios/user groups can the product serve?
6. Eliminate: What user pain points/friction can be completely eliminated?
7. Reverse: Can traditional assumptions/user habits be broken?

For each idea, include:
- Idea title
- Brief description (2-3 sentences)
- User value score (1-5 points)
- Innovation level (incremental/breakthrough)
- Emotional appeal keywords

Output in JSON format:
[
  {
    "id": "S-1",
    "dimension": "Substitute",
    "title": "...",
    "description": "...",
    "user_value": 4,
    "innovation_level": "breakthrough",
    "emotional_appeal": "delight",
    "source": "gemini"
  }
]
```
