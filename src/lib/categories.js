export const EXPENSE_CATEGORIES = [
  { name: "Food & Dining", color: "#f97316", icon: "🍽️" },
  { name: "Groceries", color: "#84cc16", icon: "🛒" },
  { name: "Transport", color: "#06b6d4", icon: "🚗" },
  { name: "Housing", color: "#8b5cf6", icon: "" },
  { name: "Utilities", color: "#eab308", icon: "💡" },
  { name: "Entertainment", color: "#ec4899", icon: "🎬" },
  { name: "Shopping", color: "#f43f5e", icon: "🛍️" },
  { name: "Health", color: "#10b981", icon: "💊" },
  { name: "Education", color: "#3b82f6", icon: "📚" },
  { name: "Travel", color: "#14b8a6", icon: "✈️" },
  { name: "Subscriptions", color: "#a855f7", icon: "📺" },
  { name: "Savings", color: "#6366f1", icon: "🎯" },
  { name: "Other", color: "#64748b", icon: "📦" },
];

export const INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e", icon: "💼" },
  { name: "Freelance", color: "#06b6d4", icon: "💻" },
  { name: "Investment", color: "#8b5cf6", icon: "📈" },
  { name: "Gift", color: "#ec4899", icon: "🎁" },
  { name: "Other Income", color: "#64748b", icon: "💰" },
];

export function categoryMeta(name, type = "expense") {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) || list[list.length - 1];
}
