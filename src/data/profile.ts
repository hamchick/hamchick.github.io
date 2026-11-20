// All page content lives here, so updating the site is mostly editing this file.

export const profile = {
  name: "Sin-En Huang",
  email: "chickenhamgod@gmail.com",
  github: "https://github.com/hamchick",
  instagram: "https://www.instagram.com/ham_chick_/",
  cv: "/files/EnCV.pdf",
  focus: ["machine learning", "economics", "web development", "blockchain"],
  intro: "Turning messy data into models, and models into things people use.",
};

export type TimelineItem = { title: string; org: string; place: string; period: string; href?: string; points?: string[] };

export const experience: TimelineItem[] = [
  {
    title: "Research Assistant",
    org: "National Taipei University · Prof. Shou-Yung Yin",
    place: "New Taipei, Taiwan",
    period: "Sep 2021 – Jun 2022",
    href: "https://econ.ntpu.edu.tw/teachers/5/27",
    points: [
      "Preprocessed and visualised economic data with Python and R.",
      "Helped prepare course material and debug teaching code.",
      "Reviewed homework and answered student questions in the programming class.",
    ],
  },
  {
    title: "Research Assistant",
    org: "National Taipei University · Prof. Mau-Ting Lin",
    place: "New Taipei, Taiwan",
    period: "Sep 2020 – Jun 2021",
    href: "https://econ.ntpu.edu.tw/teachers/5/22",
    points: ["Debugged and tested an R package for interactive data visualisation."],
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
    title: "Pokémon Review API",
    kind: ".NET Core Web API",
    points: ["Six related entities with foreign keys and full CRUD.", "Layered into interfaces, repositories and controllers."],
    tags: ["C#", ".NET", "REST", "SQL"],
    links: [{ label: "GitHub", href: "https://github.com/hamchick/PokemonReviewAPI" }],
  },
  {
    title: "Employee Management System",
    kind: ".NET Core MVC",
    points: ["CRUD over Microsoft SQL Server.", "Razor (cshtml) views on the MVC pattern."],
    tags: ["C#", "ASP.NET MVC", "SQL Server"],
    links: [{ label: "GitHub", href: "https://github.com/hamchick/.NET_MVC_CRUD_learn" }],
  },
  {
    title: "Todo List App",
    kind: "Django",
    points: ["Class-based views on Django's MVT pattern, from Harvard CS50W.", "User sign-up, authentication and database models."],
    tags: ["Python", "Django"],
    links: [{ label: "GitHub", href: "https://github.com/hamchick/Django-todo_list" }],
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

export const skills = [
  { group: "Languages", items: ["Python", "R", "C#", "TypeScript / JavaScript", "SQL"] },
  { group: "Data & ML", items: ["Time-series forecasting", "Neural networks", "NLP", "Econometrics", "Data visualisation"] },
  { group: "Web", items: ["Django", "ASP.NET Core", "React / Next.js", "HTML & CSS"] },
];

export const certificates = [
  { name: "TOEIC 950", href: "/files/TOEIC.jpg" },
  { name: "Senior Securities Specialist", href: "/files/Certificates.pdf" },
  { name: "Trust Operations Personnel", href: "/files/Certificates.pdf" },
  { name: "Financial Derivatives Sales Personnel", href: "/files/Certificates.pdf" },
  { name: "Financial Planning Personnel", href: "/files/Certificates.pdf" },
  { name: "Financial Markets and Professional Ethics", href: "/files/Certificates.pdf" },
];
