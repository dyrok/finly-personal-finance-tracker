import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Film,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Plane,
  RotateCw,
  Target,
  Package,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  PiggyBank,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { name: "Food & Dining", color: "#f59e0b", icon: UtensilsCrossed },
  { name: "Groceries", color: "#10b981", icon: ShoppingCart },
  { name: "Transport", color: "#0ea5e9", icon: Car },
  { name: "Housing", color: "#6366f1", icon: Home },
  { name: "Utilities", color: "#eab308", icon: Zap },
  { name: "Entertainment", color: "#a855f7", icon: Film },
  { name: "Shopping", color: "#ec4899", icon: ShoppingBag },
  { name: "Health", color: "#f43f5e", icon: HeartPulse },
  { name: "Education", color: "#06b6d4", icon: GraduationCap },
  { name: "Travel", color: "#14b8a6", icon: Plane },
  { name: "Subscriptions", color: "#8b5cf6", icon: RotateCw },
  { name: "Savings", color: "#22c55e", icon: Target },
  { name: "Other", color: "#64748b", icon: Package },
];

export const INCOME_CATEGORIES = [
  { name: "Salary", color: "#10b981", icon: Briefcase },
  { name: "Freelance", color: "#06b6d4", icon: Laptop },
  { name: "Investment", color: "#6366f1", icon: TrendingUp },
  { name: "Gift", color: "#ec4899", icon: Gift },
  { name: "Other Income", color: "#64748b", icon: PiggyBank },
];

export function categoryMeta(name, type = "expense") {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) || list[list.length - 1];
}
