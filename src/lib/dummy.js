import { uid } from "./storage";

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateInMonth(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * lastDay) + 1;
  return isoDate(new Date(year, month, day));
}

const EXPENSE_SAMPLES = [
  { cat: "Food & Dining", min: 10, max: 60, notes: ["Lunch", "Dinner", "Coffee", "Brunch"] },
  { cat: "Groceries", min: 40, max: 150, notes: ["Weekly shop", "Big haul", "Quick top-up"] },
  { cat: "Transport", min: 10, max: 60, notes: ["Uber", "Petrol", "Metro card", "Cab"] },
  { cat: "Utilities", min: 40, max: 120, notes: ["Electricity", "Water", "Internet"] },
  { cat: "Subscriptions", min: 8, max: 30, notes: ["Netflix", "Spotify", "Cloud storage", "Gym"] },
  { cat: "Entertainment", min: 15, max: 80, notes: ["Movie", "Concert", "Games"] },
  { cat: "Shopping", min: 20, max: 200, notes: ["Clothes", "Gadget", "Books"] },
  { cat: "Health", min: 20, max: 150, notes: ["Pharmacy", "Doctor visit", "Vitamins"] },
];

export function generateDummyData() {
  const now = new Date();
  const transactions = [];

  // 6 months of activity including the current month
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y = d.getFullYear();
    const month = d.getMonth();

    // Monthly salary (1st–3rd)
    transactions.push({
      id: uid(),
      type: "income",
      amount: randomAmount(4200, 5200),
      category: "Salary",
      note: "Monthly salary",
      date: isoDate(new Date(y, month, 1 + Math.floor(Math.random() * 3))),
    });

    // 5–8 expenses spread through the month
    const expenseCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < expenseCount; i++) {
      const ec = pick(EXPENSE_SAMPLES);
      transactions.push({
        id: uid(),
        type: "expense",
        amount: randomAmount(ec.min, ec.max),
        category: ec.cat,
        note: pick(ec.notes),
        date: randomDateInMonth(y, month),
      });
    }
  }

  // Newest first (matches the rest of the app's convention)
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  const goals = [
    {
      id: uid(),
      name: "Emergency Fund",
      emoji: "🎯",
      target: 5000,
      saved: 1200,
      deadline: null,
      note: "6 months expenses cushion",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(),
    },
    {
      id: uid(),
      name: "Trip to Japan",
      emoji: "✈️",
      target: 3000,
      saved: 1800,
      deadline: isoDate(new Date(now.getFullYear(), now.getMonth() + 6, 15)),
      note: "Spring 2027",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
    },
    {
      id: uid(),
      name: "New Laptop",
      emoji: "💻",
      target: 1500,
      saved: 1500,
      deadline: null,
      note: "Work upgrade",
      createdAt: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString(),
    },
  ];

  // Recurring rules — next dates set to next month so they don't immediately fire
  const next = (day) => isoDate(new Date(now.getFullYear(), now.getMonth() + 1, day));
  const recurring = [
    {
      id: uid(),
      type: "income",
      name: "Salary",
      amount: 4500,
      category: "Salary",
      frequency: "monthly",
      startDate: next(1),
      nextDate: next(1),
      active: true,
    },
    {
      id: uid(),
      type: "expense",
      name: "Netflix",
      amount: 15.99,
      category: "Subscriptions",
      frequency: "monthly",
      startDate: next(11),
      nextDate: next(11),
      active: true,
    },
    {
      id: uid(),
      type: "expense",
      name: "Rent",
      amount: 1200,
      category: "Housing",
      frequency: "monthly",
      startDate: next(1),
      nextDate: next(1),
      active: true,
    },
  ];

  const budgets = {
    "Food & Dining": 400,
    Groceries: 350,
    Transport: 200,
    Entertainment: 150,
    Shopping: 200,
    Utilities: 250,
    Subscriptions: 100,
  };

  return { transactions, goals, recurring, budgets };
}
