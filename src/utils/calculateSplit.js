export function calculateSplit(expenses, roommates) {
  const totalSqFt = roommates.reduce((acc, r) => acc + (parseFloat(r.sqFt) || 0), 0);
  const count = roommates.length;

  const results = roommates.map(r => ({ ...r, totalShare: 0, breakdown: [] }));

  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;

    if (expense.method.startsWith('single-')) {
      const payerId = parseInt(expense.method.split('-')[1]);
      results.forEach(person => {
        if (person.id === payerId) {
          person.totalShare += amount;
          person.breakdown.push({ name: expense.name, amount });
        }
      });
      return;
    }

    results.forEach(person => {
      let share = 0;
      switch (expense.method) {
        case 'equal':
          share = amount / count;
          break;
        case 'sqft':
          share = totalSqFt > 0 ? (parseFloat(person.sqFt) || 0) / totalSqFt * amount : 0;
          break;
        case 'percentage':
          share = ((parseFloat(person.percentage) || 0) / 100) * amount;
          break;
        default:
          share = amount / count;
      }
      person.totalShare += share;
      if (share > 0) person.breakdown.push({ name: expense.name, amount: share });
    });
  });

  results.forEach(person => {
    const adj = parseFloat(person.manualAdjustment) || 0;
    person.totalShare += adj;
    if (adj !== 0) person.breakdown.push({ name: 'Manual Adjustment', amount: adj });
  });

  return results;
}
