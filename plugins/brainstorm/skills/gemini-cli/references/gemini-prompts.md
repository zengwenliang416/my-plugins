# Gemini Brainstorming Prompt Templates

## Basic Framework

```
## Role
You are a senior user experience designer and creative expert, skilled in:
- User insights and needs discovery
- Emotional design
- Innovative thinking and breakthrough creativity
- User journey optimization
- Experience differentiation

## Task Background

Topic: {topic}

Research Summary:
{research_brief_summary}

## Your Task

Based on the above background, use the {method} method to generate 10+ user-oriented ideas.

## Thinking Dimensions

Consider each idea from the following perspectives:

1. **User Value**
   - What user pain points does it solve?
   - What emotional value does it create?
   - Why will users love it?

2. **Experience Design**
   - How to make interactions more natural?
   - How to make visuals more attractive?
   - How to make feedback more delightful?

3. **Innovation Dimension**
   - What assumptions does it break?
   - How is it different from competitors?
   - Can it lead trends?

4. **Emotional Connection**
   - What emotions can it generate?
   - How to build brand identity?
   - What memorable moments are there?

## Output Requirements

Each idea includes:
- id: Unique identifier (format: G-{number})
- title: Concise idea title
- description: 2-3 sentences describing the core concept
- user_value: User value score 1-5
  - 1: Nice to have, non-essential
  - 2: Somewhat helpful
  - 3: Solves real problems
  - 4: Significantly improves experience
  - 5: Indispensable core value
- innovation_level: Level of innovation
  - "incremental": Improves existing experience
  - "breakthrough": Entirely new experience mode
- emotional_appeal: Emotional appeal type
  - "practical": Efficient, worry-free
  - "surprising": Exceeds expectations
  - "delightful": Pleasant to use
  - "resonant": Emotional identification
- source: "gemini"

## JSON Output Format

Output only JSON array, no other explanations:

[
  {
    "id": "G-1",
    "title": "Idea Title",
    "description": "Idea description...",
    "user_value": 4,
    "innovation_level": "incremental",
    "emotional_appeal": "delightful",
    "source": "gemini"
  }
]

Please generate at least 10 high-quality ideas.
```

---

## SCAMPER Method Template

```
## Role
You are a senior user experience designer.

## Task
Use the SCAMPER method to generate user-oriented ideas for the following topic.

Topic: {topic}
Research Background: {research_brief_summary}

## SCAMPER Dimensions (User Perspective)

For each dimension, generate 2 ideas from the perspectives of user experience, emotional value, and innovation:

### S - Substitute
- What user needs can be met in new ways?
- What traditional interactions can be replaced with more natural methods?
- What complex processes can be simplified?

### C - Combine
- What feature combinations can create surprises?
- What experience fusions can produce 1+1>2 effects?
- How to combine entertainment with practicality?

### A - Adapt
- What experiences from the gaming industry can be borrowed?
- How can the sense of ritual from luxury brands be applied?
- What mechanisms from social media are worth learning?

### M - Modify (Magnify/Minimize)
- How to make features more ceremonial?
- How to make interactions more lightweight?
- How to make feedback more dramatic?

### P - Put to other uses
- What other scenarios can the product serve?
- Where can the core experience be extended?
- What else do users want to do with it?

### E - Eliminate
- What steps annoy users?
- What features are actually unused?
- What information is noise?

### R - Reverse (Rearrange)
- What if users become passive instead of active?
- Is try-before-register feasible?
- Let users become creators?

## Output Format

Output only JSON array:
[
  {
    "id": "S-1",
    "dimension": "Substitute",
    "title": "...",
    "description": "...",
    "user_value": 4,
    "innovation_level": "incremental",
    "emotional_appeal": "surprising",
    "source": "gemini"
  }
]
```

---

## Six Thinking Hats Template

```
## Role
You are a senior user experience designer.

## Task
Use the Six Thinking Hats method to generate user-oriented ideas for the following topic.

Topic: {topic}
Research Background: {research_brief_summary}

## Six Thinking Hats (User Perspective)

For each hat, generate 2 ideas from a user experience perspective:

### White Hat (Data/Facts)
- What needs does user research data reveal?
- What patterns exist in user behavior data?
- What findings come from market research?

### Red Hat (Intuition/Feelings)
- What is the user's first impression?
- What features do users resist?
- What does intuition tell us users want?

### Black Hat (Risks/Criticism)
- Where might users drop off?
- What experiences will disappoint users?
- What potential trust issues exist?

### Yellow Hat (Value/Optimism)
- What are users' favorite features?
- What experiences can surprise users?
- Where are the triggers for word-of-mouth?

### Green Hat (Creativity/Possibilities)
- What new interaction methods exist?
- How to create differentiated experiences?
- Can user expectations be disrupted?

### Blue Hat (Process/Control)
- How to optimize the user journey?
- Where are the key touchpoints?
- How to measure experience improvement?

## Output Format

Output only JSON array:
[
  {
    "id": "W-1",
    "hat": "white",
    "title": "...",
    "description": "...",
    "user_value": 4,
    "innovation_level": "incremental",
    "emotional_appeal": "practical",
    "source": "gemini"
  }
]
```

---

## User Value Assessment Criteria

| Score | Level     | Description                       | Typical Scenarios         |
| ----- | --------- | --------------------------------- | ------------------------- |
| 1     | Very Low  | Nice to have                      | Decorative features       |
| 2     | Low       | Somewhat helpful                  | Convenience improvements  |
| 3     | Medium    | Solves real problems              | Functional requirements   |
| 4     | High      | Significantly improves experience | Differentiated experience |
| 5     | Very High | Core value                        | Key to user retention     |

## Emotional Appeal Classification

| Type       | Description              | Design Focus                                         |
| ---------- | ------------------------ | ---------------------------------------------------- |
| Practical  | Efficient, worry-free    | Reduce operation steps, clear feedback               |
| Surprising | Exceeds expectations     | Easter eggs, hidden features, unexpected rewards     |
| Delightful | Pleasant to use          | Micro-interactions, smooth animations, fun copy      |
| Resonant   | Emotional identification | Personalization, community feeling, value expression |
