// All page content lives here, so updating the site is mostly editing this file.

export const profile = {
  name: "Hsin-En Huang",
  // The name I go by online, shown in the header logo and under the name on the home page.
  handle: "hamchick",
  email: "chickenhamgod@gmail.com",
  github: "https://github.com/hamchick",
  instagram: "https://www.instagram.com/ham_chick_/",
  // No CV link until there's a current one.
  cv: null as string | null,
  focus: ["LLM agents", "machine learning", "finance", "web development"],
  intro: "My assistant helps bankers find answers.\nAnd I look for harder questions.",
};

export type TimelineItem = { title: string; org: string; place: string; period: string; href?: string; points?: string[] };

export const experience: TimelineItem[] = [
  {
    title: "LLM Engineer",
    org: "CTBC Bank",
    place: "Taipei, Taiwan",
    period: "Jun 2025 – Present",
    href: "https://www.ctbcbank.com/",
    points: [
      "Designed and built the core of an in-house LLM assistant that the bank's relationship managers use to search internal knowledge, look up a client and screen client lists in plain language.",
      "Halved response time by moving from Langflow and LangGraph to the OpenAI Agents SDK, precomputing heavy work overnight, and racing a small model against a large one.",
      "Built the production side: token budgets, keyless auth, fallbacks, access control, masking of client names, guardrails and LLM-as-a-judge evaluation.",
      "Co-developed shared streaming and observability packages with IT, now used by other internal AI projects.",
    ],
  },
  {
    title: "Management Associate, Technology",
    org: "CTBC Bank",
    place: "Taipei, Taiwan",
    period: "Jul 2023 – May 2025",
    href: "https://www.ctbcbank.com/",
    points: [
      "Rotated through information security, IT planning, digital finance innovation, data science and business analysis.",
      "In information security, researched the risks of LLMs, which later shaped the guardrails in the assistant above.",
      "In IT planning, was part of the team that brought GitHub Copilot into the bank: worked through the security and compliance review, planned a seed-user programme and tracked adoption.",
      "In data science, evaluated agent frameworks such as LangGraph and Langflow and assessed technical risks for the bank's generative AI policy, which led into building the assistant.",
    ],
  },
  {
    title: "Research Assistant",
    org: "National Taipei University · Economics",
    place: "New Taipei, Taiwan",
    period: "Sep 2020 – Jun 2022",
    href: "https://econ.ntpu.edu.tw/",
    points: [
      "Cleaned and visualised economic data in Python and R, and TA'd a programming course.",
      "Tested and debugged an R package for interactive data visualisation.",
    ],
  },
];

export const education: TimelineItem[] = [
  {
    title: "M.A. in Economics",
    org: "National Taipei University",
    place: "New Taipei, Taiwan",
    period: "2020 – 2022",
    href: "https://new.ntpu.edu.tw/",
  },
  {
    title: "B.S. in Computer Science",
    org: "National Taiwan University of Science and Technology",
    place: "Taipei, Taiwan",
    period: "2016 – 2020",
    href: "https://www.ntust.edu.tw/",
  },
];

export const thesis = {
  title: "Bitcoin Price Forecast Using Echo State Network",
  href: "https://hdl.handle.net/11296/7eqg42",
  points: [
    "Echo State Networks are recurrent neural networks with a sparsely connected, fixed-weight reservoir.",
    "Compared four model structures, from a classic ARIMA baseline to Echo State Networks with different techniques.",
    "With phase-space reconstruction, the Echo State Network escaped the random-walk hypothesis and produced efficient forecasts.",
  ],
  tags: ["Python", "Time series", "RNN", "ARIMA"],
};

export type Project = { title: string; kind: string; points: string[]; tags: string[]; links: { label: string; href: string }[] };

export const projects: Project[] = [
  {
    title: "LLM assistant for relationship managers",
    kind: "CTBC Bank · LLM agents",
    points: [
      "A chat assistant inside the system the bank's relationship managers already use: it answers from internal knowledge, pulls up a client, and finds clients that match a description.",
      "I built the main flow and the architecture; teammates built most of the tools on top.",
      "The internal work is private, so there's no code to link. Happy to talk it through.",
    ],
    tags: ["Python", "OpenAI Agents SDK", "FastAPI", "Guardrails", "Evaluation"],
    links: [],
  },
  {
    title: "JLPT study system, coached by Claude",
    kind: "Side project · In progress",
    points: [
      "Preparing for JLPT N2 and N3 on the same day in December 2026, two hours a day in scattered slots, with Claude as the study coach.",
      "Started from a timed baseline on a past paper. Reading and listening were already strong; the wrong answers showed the gap was grammar in isolation, not using the language.",
      "Built the plan around that: two custom Anki decks, a grammar reference written in Chinese, and an error log grouped by concept that decides what to study next.",
      "Results come out in early 2027.",
    ],
    tags: ["Claude", "Anki / FSRS", "Spaced repetition", "Japanese"],
    links: [],
  },
  {
    title: "Fake News Detection",
    kind: "Independent study · NLP",
    points: [
      "Natural language processing on news reports to decide whether they are fake.",
      "Implemented and compared both classification and regression approaches across many models.",
    ],
    tags: ["Python", "NLP", "Machine learning"],
    links: [
      { label: "Report", href: "https://drive.google.com/file/d/1ZwoqvLV5wR0spBtfCrrcylUMLvZEU7G8/view" },
      { label: "GitHub", href: "https://github.com/hamchick/FakeNewsDetect" },
    ],
  },
  {
    title: "Interactive Visual Dashboard",
    kind: "Independent study · R",
    points: [
      "Debugged and tested an R package by Prof. Mau-Ting Lin.",
      "Plots any chosen dataset with several interactive methods.",
    ],
    tags: ["R", "Data viz"],
    links: [{ label: "GitHub", href: "https://github.com/hamchick/Iteractive-visual-dashboard" }],
  },
  {
    title: "This website",
    kind: "Next.js · Canvas",
    points: [
      "Static Next.js site deployed to GitHub Pages with GitHub Actions.",
      "The pond is a hand-written wave simulation drawn as ASCII on a canvas. Try clicking the water.",
    ],
    tags: ["TypeScript", "React", "Canvas"],
    links: [{ label: "GitHub", href: "https://github.com/hamchick/hamchick.github.io" }],
  },
];

// `core` is what I use day to day; the About page lights those up and keeps the rest quiet.
export const skills = [
  { group: "LLM & ML", core: ["LLM agents", "Guardrails & evaluation"], items: ["NLP", "Time-series forecasting", "Econometrics"] },
  { group: "Engineering", core: ["AI-assisted development", "OpenAI Agents SDK", "FastAPI"], items: ["Azure OpenAI", "LangGraph / Langflow", "Redis & SQL Server", "OpenTelemetry"] },
  { group: "Languages", core: ["Python"], items: ["SQL", "TypeScript / React", "R"] },
];

export const certificates: { group: string; items: { name: string; date: string }[] }[] = [
  {
    group: "Finance",
    items: [
      { name: "Financial Planning Personnel", date: "Nov 2022" },
      { name: "Trust Business Professional", date: "Nov 2022" },
      { name: "Financial Derivatives Sales Personnel", date: "Oct 2022" },
      { name: "Senior Securities Specialist", date: "Jan 2022" },
      { name: "Financial Markets and Professional Ethics", date: "Jan 2022" },
    ],
  },
  // JLPT goes here once the results are in.
  { group: "Language", items: [{ name: "TOEIC 950", date: "Sep 2022" }] },
];
