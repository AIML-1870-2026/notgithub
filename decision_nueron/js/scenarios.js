// ============================================================
// Scenario Presets & Custom Scenario Logic
// ============================================================

const SCENARIOS = {
  workout: {
    question: "Should I Work Out Today?",
    yesLabel: "Let's Go!",
    noLabel: "Rest Day",
    bias: 0.5,
    inputs: [
      { name: "Workouts This Week", min: 0, max: 7, step: 1, default: 3, weight: -0.6, unit: "days" },
      { name: "Fatigue Level", min: 0, max: 1, step: 0.01, default: 0.4, weight: -1.2, unit: "" },
      { name: "Hours of Sleep", min: 0, max: 12, step: 0.5, default: 7, weight: 0.5, unit: "hrs" },
      { name: "Schedule Openness", min: 0, max: 1, step: 0.01, default: 0.6, weight: 1.0, unit: "" },
      { name: "Motivation", min: 0, max: 1, step: 0.01, default: 0.5, weight: 1.3, unit: "" }
    ]
  },
  cook: {
    question: "Cook or Order Takeout?",
    yesLabel: "Cook!",
    noLabel: "Order In",
    bias: 0.3,
    inputs: [
      { name: "Budget Left", min: 0, max: 1, step: 0.01, default: 0.5, weight: 1.0, unit: "" },
      { name: "Time Available", min: 0, max: 1, step: 0.01, default: 0.5, weight: 1.2, unit: "" },
      { name: "Ingredients on Hand", min: 0, max: 1, step: 0.01, default: 0.4, weight: 0.8, unit: "" },
      { name: "Energy Level", min: 0, max: 1, step: 0.01, default: 0.5, weight: 0.6, unit: "" },
      { name: "Craving Intensity", min: 0, max: 1, step: 0.01, default: 0.5, weight: -0.9, unit: "" }
    ]
  },
  study: {
    question: "Should I Study or Game?",
    yesLabel: "Study!",
    noLabel: "Game Time",
    bias: -0.2,
    inputs: [
      { name: "Exam Proximity", min: 0, max: 1, step: 0.01, default: 0.5, weight: 1.5, unit: "" },
      { name: "Current Grade", min: 0, max: 1, step: 0.01, default: 0.7, weight: -0.7, unit: "" },
      { name: "Assignment Due", min: 0, max: 1, step: 0.01, default: 0.3, weight: 1.2, unit: "" },
      { name: "Friends Online", min: 0, max: 1, step: 0.01, default: 0.5, weight: -1.0, unit: "" },
      { name: "Focus Level", min: 0, max: 1, step: 0.01, default: 0.5, weight: 0.8, unit: "" }
    ]
  },
  roadtrip: {
    question: "Worth the Road Trip?",
    yesLabel: "Let's Roll!",
    noLabel: "Stay Home",
    bias: 0.1,
    inputs: [
      { name: "Distance (short=1)", min: 0, max: 1, step: 0.01, default: 0.5, weight: -0.8, unit: "" },
      { name: "Gas Budget", min: 0, max: 1, step: 0.01, default: 0.5, weight: 0.7, unit: "" },
      { name: "Friends Going", min: 0, max: 1, step: 0.01, default: 0.5, weight: 1.3, unit: "" },
      { name: "Event Quality", min: 0, max: 1, step: 0.01, default: 0.6, weight: 1.1, unit: "" }
    ]
  }
};
