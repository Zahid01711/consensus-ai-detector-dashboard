# AI Review Validation: Sample Text Fixtures

Use these copy-paste text fixtures to test the consensus score and individual AI detector adapter results in your local or production dashboard.

---

## 🟢 Fixture 1: Human-Written Text (Low AI Probability)
*Expected detector score: Under 15% AI Risk*

> "When I look back on my time in college, it's not the long lectures or the exams that stand out the most. Instead, it’s the quiet evenings spent in the library with my study group, fueled by cold coffee and shared frustration over chemistry homework. We didn't always get the answers right, but we figured out how to think through problems together. That process of struggling, failing, and trying again taught me more about resilience than any textbook ever could. I think that is the real value of university: learning how to adapt and finding your people along the way."

---

## 🔴 Fixture 2: Pure AI-Generated Text (High AI Probability)
*Expected detector score: Over 90% AI Risk*

> "Artificial intelligence has experienced rapid development in recent years, leading to significant advancements in natural language processing. By utilizing deep learning neural network architectures, machines can analyze statistical patterns within massive text corpora to generate coherent responses. These systems evaluate word placement frequencies to estimate the probability of subsequent tokens, producing text that mimics human composition styles. However, this process relies entirely on mathematical distributions, lacking any genuine comprehension or consciousness. As LLM technologies continue to evolve, they will inevitably reshape academic research and creative industries."

---

## 🟡 Fixture 3: Hybrid / Mixed Text (Medium AI Probability)
*Expected detector score: 35% - 70% AI Risk*

> "I spent the entire weekend trying to fix a bug in my React app. It was incredibly frustrating because every time I resolved one issue, two new errors would pop up. Finally, I decided to analyze the state management model. In a typical React application, state represents the data that determines component behavior. When state changes, React schedules a re-render of the virtual DOM, comparing the new node tree with the previous one to apply minimal modifications. After realizing I was accidentally mutating the state instead of creating a shallow copy, I applied the correction and the application launched successfully. It was a massive relief to see the dashboard load without error."
