import { uid } from "./storage";

export function nextDate(dateISO, frequency) {
  const [y, m, d] = dateISO.split("-").map(Number);
  let year = y;
  let month = m;
  let day = d;

  switch (frequency) {
    case "daily":
      day += 1;
      break;
    case "weekly":
      day += 7;
      break;
    case "biweekly":
      day += 14;
      break;
    case "monthly":
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      break;
    case "yearly":
      year += 1;
      break;
    default:
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
  }

  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) day = maxDay;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function materializeRecurring(recurring, existingTransactions) {
  const today = todayISO();

  let allTransactions = existingTransactions || [];
  try {
    const stored = localStorage.getItem("ft.transactions");
    if (stored) {
      allTransactions = JSON.parse(stored);
    }
  } catch {
    /* use passed array */
  }

  const newTx = [];
  const updatedRecurring = recurring.map((r) => {
    if (!r.active) return r;

    let next = r.nextDate;
    const createdDates = new Set();

    while (next <= today) {
      const exists = allTransactions.some(
        (t) => t.recurringId === r.id && t.date === next,
      );
      if (!exists && !createdDates.has(next)) {
        newTx.push({
          id: uid(),
          type: r.type,
          amount: Number(r.amount),
          category: r.category,
          note: r.note || r.name,
          date: next,
          recurringId: r.id,
        });
        createdDates.add(next);
      }
      next = nextDate(next, r.frequency);
    }

    return { ...r, nextDate: next };
  });

  return { newTx, updatedRecurring };
}
