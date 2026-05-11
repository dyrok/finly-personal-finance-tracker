import { uid } from "./storage";

export function nextDate(dateISO, frequency) {
  const d = new Date(dateISO);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
}

export function materializeRecurring(recurring, transactions) {
  const today = new Date().toISOString().slice(0, 10);
  const newTx = [];
  const updatedRecurring = recurring.map((r) => {
    if (!r.active) return r;
    let next = r.nextDate;
    while (next <= today) {
      const exists = transactions.some(
        (t) => t.recurringId === r.id && t.date === next,
      );
      if (!exists) {
        newTx.push({
          id: uid(),
          type: r.type,
          amount: Number(r.amount),
          category: r.category,
          note: r.note || r.name,
          date: next,
          recurringId: r.id,
        });
      }
      next = nextDate(next, r.frequency);
    }
    return { ...r, nextDate: next };
  });
  return { newTx, updatedRecurring };
}
