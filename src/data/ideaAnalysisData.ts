export interface StrategySection {
  title: string;
  icon: string;
  badge?: string;
  items: {
    subtitle: string;
    description: string;
    impact: 'High' | 'Medium' | 'Critical';
    solutionOrTip?: string;
  }[];
}

export const IDEA_ANALYSIS_DATA = {
  projectTitle: "YouTube Thumbnail AI Analysis & Design Platform",
  summary: "This product concept is a high-value micro-SaaS / AI tool designed to directly increase YouTube creators' click-through rates (CTR). The biggest pain point for YouTubers is 'Great video, but nobody is clicking'.",

  weaknesses: [
    {
      subtitle: "Lack of Guaranteed CTR Increase",
      description: "AI analyses provide theoretical CTR estimates, but real CTR depends on YouTube algorithms, audience demographics, and real-time trends. Managing user expectations is essential.",
      impact: "Critical" as const,
      solutionOrTip: "Use 'CTR Optimization Score' instead of guaranteed CTR numbers and include a helpful disclaimer."
    },
    {
      subtitle: "Text & Face Generation Quality in AI Images",
      description: "Text-to-image AI generators can sometimes produce imperfect typography or face details when generating standalone images.",
      impact: "High" as const,
      solutionOrTip: "Provide clear text overlay guidelines, font recommendations, and separate layer templates for Canva/Photoshop."
    },
    {
      subtitle: "YouTube UI Changes & Timestamp Overlays",
      description: "YouTube feed layouts and mobile button positions (such as the bottom-right duration badge) update over time.",
      impact: "Medium" as const,
      solutionOrTip: "Integrate a live YouTube Feed Simulator with a duration timestamp overlap check."
    }
  ],

  improvements: [
    {
      subtitle: "Live A/B Split-Test Predictor",
      description: "Users upload 2 candidate thumbnails. AI simulates them side-by-side in YouTube search results and predicts which one will achieve a higher CTR.",
      impact: "High" as const
    },
    {
      subtitle: "Niche & Competitor Benchmark",
      description: "Compares the user's thumbnail color palette and contrast against top-performing videos in the same niche (e.g., Tech, Gaming, Finance).",
      impact: "High" as const
    },
    {
      subtitle: "Canva & Photoshop Extensions",
      description: "Enables creators to click 'Analyze CTR' directly inside Canva or Photoshop without exporting files first.",
      impact: "Medium" as const
    },
    {
      subtitle: "Visual Eye-Tracking Heatmap Simulation",
      description: "Generates an artificial eye-tracking overlay showing where viewers' eyes focus in the first 1.5 seconds.",
      impact: "High" as const
    }
  ],

  mvpSteps: [
    {
      phase: "Phase 1: MVP Preparation",
      duration: "1 - 2 Weeks",
      tasks: [
        "Single-page React/Vite web application.",
        "Video Title + Topic + Thumbnail image upload form.",
        "Gemini Vision API integration with 5 key metrics (Readability, Emotion, Focal Point, Color, Mobile Visibility).",
        "AI Thumbnail Concept Blueprint + AI Image Generator integration."
      ]
    },
    {
      phase: "Phase 2: Beta & Creator Feedback",
      duration: "3 - 4 Weeks",
      tasks: [
        "YouTube Feed Preview Mode (Desktop/Mobile, Dark/Light theme).",
        "Free beta testing with 50+ YouTube creators in Discord & Twitter groups.",
        "Exportable PDF & image report sharing capability."
      ]
    },
    {
      phase: "Phase 3: Monetization & Scale",
      duration: "2 Months",
      tasks: [
        "Freemium Model (3 free analyses per month, then $9/month subscription).",
        "Competitor channel thumbnail comparison tool.",
        "Stripe payment & billing subscription integration."
      ]
    }
  ],

  techStack: [
    "Frontend: React 18 + TypeScript + Tailwind CSS",
    "Backend: Node.js Express + @google/genai (Server-side API)",
    "AI Models: Gemini 3.6 Flash (Vision & Text Analysis), Gemini 3.1 Flash Image (Thumbnail Gen)",
    "Storage: Firestore or PostgreSQL (Saved analysis history)"
  ]
};
