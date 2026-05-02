import { toNumber } from './data-service.js';

export const PRODUCT_CATEGORY_ORDER = ["Hats", "Drinkware", "Clothing", "Accessories", "Home decor"];

export function calculateExpTotal(transactions) {
  return (transactions || []).reduce((total, transaction) => {
    return total + toNumber(transaction.trAmount);
  }, 0);
}

export function calculateRevTotal(orders) {
  return (orders || []).reduce((total, order) => {
    return total + toNumber(order.orderTotal);
  }, 0);
}

export function calculateOrderStatusCounts(orders) {
  const counts = {
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0
  };

  (orders || []).forEach((order) => {
    if (counts[order.orderStatus] !== undefined) {
      counts[order.orderStatus] += 1;
    }
  });

  return counts;
}

export function calculateDashboardSummary(expenses, orders) {
  const totalExpenses = calculateExpTotal(expenses);
  const totalRevenues = calculateRevTotal(orders);
  const statusCounts = calculateOrderStatusCounts(orders);

  return {
    totalExpenses,
    totalRevenues,
    totalBalance: totalRevenues - totalExpenses,
    numOrders: (orders || []).length,
    statusCounts
  };
}

export function findCategoryForItemName(itemName, products) {
  if (!itemName || typeof itemName !== "string") return null;

  const trimmed = itemName.trim();

  for (let i = 0; i < (products || []).length; i++) {
    const product = products[i];
    if (!product || !product.prodName) continue;
    if (product.prodName === trimmed) return product.prodCat;
  }

  const lower = trimmed.toLowerCase();

  for (let j = 0; j < (products || []).length; j++) {
    const product = products[j];
    if (!product || !product.prodName) continue;
    if (product.prodName.trim().toLowerCase() === lower) return product.prodCat;
  }

  return null;
}

export function calculateCategoryUnitsSoldFromOrders(orders, products) {
  const totals = {};

  PRODUCT_CATEGORY_ORDER.forEach((category) => {
    totals[category] = 0;
  });

  (orders || []).forEach((order) => {
    const category = findCategoryForItemName(order.itemName, products);
    if (!category || totals[category] === undefined) return;
    totals[category] += toNumber(order.qtyBought);
  });

  return totals;
}

export function calculateCategoryExpenses(expenses) {
  const categoryExpenses = {};

  (expenses || []).forEach((transaction) => {
    const category = transaction.trCategory;
    if (!categoryExpenses[category]) {
      categoryExpenses[category] = 0;
    }

    categoryExpenses[category] += toNumber(transaction.trAmount);
  });

  return categoryExpenses;
}

function monthKeyFromDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return year + "-" + month;
}

export function aggregateByMonth(orders, expenses) {
  const monthMap = {};

  (orders || []).forEach((order) => {
    const month = monthKeyFromDate(order.orderDate);
    if (!month) return;

    if (!monthMap[month]) {
      monthMap[month] = { revenue: 0, expenses: 0 };
    }

    monthMap[month].revenue += toNumber(order.orderTotal);
  });

  (expenses || []).forEach((item) => {
    const month = monthKeyFromDate(item.trDate);
    if (!month) return;

    if (!monthMap[month]) {
      monthMap[month] = { revenue: 0, expenses: 0 };
    }

    monthMap[month].expenses += toNumber(item.trAmount);
  });

  return Object.keys(monthMap).sort().map((month) => {
    const revenue = monthMap[month].revenue;
    const expensesValue = monthMap[month].expenses;
    const net = revenue - expensesValue;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;

    return {
      month,
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(expensesValue.toFixed(2)),
      net: Number(net.toFixed(2)),
      margin: Number(margin.toFixed(2))
    };
  });
}
