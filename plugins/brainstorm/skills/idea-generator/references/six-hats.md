# Six Thinking Hats Creative Divergence Method

## Method Overview

Six Thinking Hats is a parallel thinking method proposed by Edward de Bono. By using six different colored "hats" representing six thinking modes, it makes thinking more comprehensive and systematic.

| Hat    | Color  | Thinking Perspective         | Keywords                          |
| ------ | ------ | ---------------------------- | --------------------------------- |
| White  | White  | Facts and Data               | Objective, Neutral, Information   |
| Red    | Red    | Emotions and Intuition       | Feelings, Hunches, Instinct       |
| Black  | Black  | Critique and Risk            | Caution, Problems, Obstacles      |
| Yellow | Yellow | Optimism and Value           | Benefits, Opportunities, Positive |
| Green  | Green  | Creativity and Possibilities | New ideas, Alternatives           |
| Blue   | Blue   | Control and Summary          | Process, Integration, Decision    |

## Detailed Dimensions and Question Templates

### White Hat (Facts and Data)

**Core Concept**: Focus on objective information without making judgments

**Question Checklist**:

- What do we currently know?
- What information is still needed?
- What are the data sources?
- What are the confirmed facts?
- What are uncertain assumptions?

**Output Types**:

- Status assessment ideas
- Data-driven ideas
- Information transparency ideas

**Example Questions**:

- "What exact data do we have about user behavior?"
- "What is the competitor's actual market share?"

### Red Hat (Emotions and Intuition)

**Core Concept**: Express feelings, allow irrationality

**Question Checklist**:

- What is your first reaction to this idea?
- What emotions might users have?
- What does intuition tell us?
- What excites or concerns people?
- Where is the team's enthusiasm?

**Output Types**:

- Emotional experience ideas
- User empathy ideas
- Brand emotion ideas

**Example Questions**:

- "What will users feel when they first use it?"
- "What about this solution makes me feel uneasy?"

### Black Hat (Critique and Risk)

**Core Concept**: Identify problems and risks, evaluate cautiously

**Question Checklist**:

- What could go wrong?
- What are the risks and obstacles?
- Why might it fail?
- What are the negative consequences?
- Are resources sufficient?

**Output Types**:

- Risk mitigation ideas
- Problem-solving ideas
- Safety assurance ideas

**Example Questions**:

- "What if competitors quickly follow?"
- "What is the biggest technical risk?"

### Yellow Hat (Optimism and Value)

**Core Concept**: Seek value and opportunities, evaluate positively

**Question Checklist**:

- What is the best-case scenario?
- What are the benefits and opportunities?
- Why will it succeed?
- Who will benefit from it?
- Where is the long-term value?

**Output Types**:

- Value amplification ideas
- Opportunity capture ideas
- Differentiation advantage ideas

**Example Questions**:

- "What is the biggest value point of this solution?"
- "If successful, what will it look like in 3 years?"

### Green Hat (Creativity and Possibilities)

**Core Concept**: Think outside the box, explore new possibilities

**Question Checklist**:

- What alternatives are there?
- What if there were no constraints?
- What new methods can be used?
- What crazy ideas are there?
- How to break existing boundaries?

**Output Types**:

- Disruptive ideas
- Cross-domain fusion ideas
- Experimental exploration ideas

**Example Questions**:

- "If we completely redesigned it, how would we do it?"
- "Is there a completely different way to solve this problem?"

### Blue Hat (Control and Summary)

**Core Concept**: Manage the thinking process, integrate conclusions

**Question Checklist**:

- What should the next step be?
- How to integrate all perspectives?
- What are the priorities?
- What decisions need to be made?
- How to follow up on execution?

**Output Types**:

- Process optimization ideas
- Decision mechanism ideas
- Execution planning ideas

**Example Questions**:

- "Based on the above discussion, what is our core conclusion?"
- "What is the most critical next action?"

## Codex Prompt Template (Technical Perspective)

```
As a system architect, use the Six Thinking Hats method to generate ideas for the following topic:

Topic: {topic}
Research Background: {research_brief_summary}

From a technical implementation perspective, generate 2-3 ideas for each hat:

White Hat (Data/Facts):
- What data needs to be collected to validate assumptions?
- What are the confirmed technical constraints?
- What are the actual performance metrics of the existing system?

Red Hat (Intuition/Feelings):
- Which solutions does the technical team feel most confident about?
- Which technical debt is concerning?
- Which direction does intuition suggest has the most potential?

Black Hat (Risk/Critique):
- What is the biggest technical risk?
- What performance bottlenecks might be encountered?
- What security vulnerabilities exist?

Yellow Hat (Value/Optimism):
- What is the biggest technical advantage?
- What existing capabilities can be reused?
- What technical accumulation will success bring?

Green Hat (Creativity/Possibilities):
- What new technologies are worth trying?
- What architectural innovations are possible?
- How to break through existing technical limitations?

Blue Hat (Process/Control):
- What is the optimal sequence for technical implementation?
- How to validate in phases?
- What decision points and rollback mechanisms are needed?

For each idea, include:
- Idea title
- Brief description (2-3 sentences)
- Technical complexity (1-5 points)
- Estimated implementation timeline
- Key dependencies

Output in JSON format:
[
  {
    "id": "W-1",
    "hat": "white",
    "title": "...",
    "description": "...",
    "technical_complexity": 3,
    "timeline": "medium-term",
    "dependencies": ["..."],
    "source": "codex"
  }
]
```

## Gemini Prompt Template (User Perspective)

```
As a user experience expert, use the Six Thinking Hats method to generate ideas for the following topic:

Topic: {topic}
Research Background: {research_brief_summary}

From a user experience perspective, generate 2-3 ideas for each hat:

White Hat (Data/Facts):
- What does user behavior data tell us?
- What are the core demands from user feedback?
- What trends does market research reveal?

Red Hat (Intuition/Feelings):
- What are the users' emotional needs?
- What will delight/disappoint users?
- What is our intuitive understanding of users?

Black Hat (Risk/Critique):
- What might users resist?
- What experience issues will cause churn?
- Where do competitors deliver better experiences?

Yellow Hat (Value/Optimism):
- What is the greatest value to users?
- What experience will make users actively recommend?
- How will users describe this product after success?

Green Hat (Creativity/Possibilities):
- What brand new interaction methods are possible?
- How to create experiences beyond expectations?
- What cross-domain user experiences can be borrowed?

Blue Hat (Process/Control):
- What is the optimal user journey design?
- How to optimize experience in phases?
- What are the experience design priorities?

For each idea, include:
- Idea title
- Brief description (2-3 sentences)
- User value score (1-5 points)
- Innovation level (incremental/breakthrough)
- Emotional appeal keywords

Output in JSON format:
[
  {
    "id": "W-1",
    "hat": "white",
    "title": "...",
    "description": "...",
    "user_value": 4,
    "innovation_level": "breakthrough",
    "emotional_appeal": "trust",
    "source": "gemini"
  }
]
```

## Usage Recommendations

### Applicable Scenarios

- Strategic decision problems
- Complex project evaluation
- Topics requiring multi-angle analysis
- Team collaborative brainstorming

### Recommended Execution Order

1. Blue Hat: Define the problem clearly
2. White Hat: Gather factual information
3. Green Hat: Diverge ideas
4. Yellow Hat: Evaluate value
5. Black Hat: Identify risks
6. Red Hat: Intuitive judgment
7. Blue Hat: Summarize actions

### Differences from SCAMPER

| Dimension              | Six Thinking Hats       | SCAMPER                   |
| ---------------------- | ----------------------- | ------------------------- |
| Thinking Approach      | Multi-angle evaluation  | Transformation operations |
| Applicable Stage       | Evaluation and decision | Creative divergence       |
| Output Characteristics | Comprehensive and deep  | Abundant quantity         |
| Best Scenarios         | Strategic issues        | Product innovation        |
