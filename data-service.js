export const DEFAULT_EXPENSES = [
  { trID: 1, trDate: "2024-01-05", trCategory: "Rent", trAmount: 100.0, trNotes: "January Rent" },
  { trID: 2, trDate: "2024-01-15", trCategory: "Order Fulfillment", trAmount: 35.0, trNotes: "Order #1005" },
  { trID: 3, trDate: "2024-01-08", trCategory: "Utilities", trAmount: 120.0, trNotes: "Internet" },
  { trID: 4, trDate: "2024-02-05", trCategory: "Supplies", trAmount: 180.0, trNotes: "Embroidery Machine" },
  { trID: 5, trDate: "2024-01-25", trCategory: "Miscellaneous", trAmount: 20.0, trNotes: "Pizza" }
];

export const DEFAULT_ORDERS = [
  { orderID: "1001", orderDate: "2024-01-05", itemName: "Baseball caps", itemPrice: 25.0, qtyBought: 2, shipping: 2.5, taxes: 9.0, orderTotal: 61.5, orderStatus: "Pending" },
  { orderID: "1002", orderDate: "2024-03-05", itemName: "Water bottles", itemPrice: 17.0, qtyBought: 3, shipping: 3.5, taxes: 6.0, orderTotal: 60.5, orderStatus: "Processing" },
  { orderID: "1003", orderDate: "2024-02-05", itemName: "Tote bags", itemPrice: 20.0, qtyBought: 4, shipping: 2.5, taxes: 2.0, orderTotal: 84.5, orderStatus: "Shipped" },
  { orderID: "1004", orderDate: "2023-01-05", itemName: "Canvas prints", itemPrice: 55.0, qtyBought: 1, shipping: 2.5, taxes: 19.0, orderTotal: 76.5, orderStatus: "Delivered" },
  { orderID: "1005", orderDate: "2024-01-15", itemName: "Beanies", itemPrice: 15.0, qtyBought: 2, shipping: 3.9, taxes: 4.0, orderTotal: 37.9, orderStatus: "Pending" }
];

export const DEFAULT_PRODUCTS = [
  { prodID: "PD001", prodName: "Baseball caps", prodDesc: "Peace embroidered cap", prodCat: "Hats", prodPrice: 25.0, prodSold: 20 },
  { prodID: "PD002", prodName: "Snapbacks", prodDesc: "Classic snapback fit", prodCat: "Hats", prodPrice: 28.0, prodSold: 15 },
  { prodID: "PD003", prodName: "Beanies", prodDesc: "Warm knit beanie", prodCat: "Hats", prodPrice: 18.5, prodSold: 32 },
  { prodID: "PD004", prodName: "Bucket hats", prodDesc: "Summer bucket style", prodCat: "Hats", prodPrice: 22.0, prodSold: 12 },
  { prodID: "PD005", prodName: "Mugs", prodDesc: "Ceramic travel mug", prodCat: "Drinkware", prodPrice: 14.0, prodSold: 45 },
  { prodID: "PD006", prodName: "Water bottles", prodDesc: "Floral lotus printed bottle", prodCat: "Drinkware", prodPrice: 48.5, prodSold: 10 },
  { prodID: "PD007", prodName: "Tumblers", prodDesc: "Insulated tumbler", prodCat: "Drinkware", prodPrice: 32.0, prodSold: 28 },
  { prodID: "PD008", prodName: "T-shirts", prodDesc: "Soft cotton tee", prodCat: "Clothing", prodPrice: 19.99, prodSold: 55 },
  { prodID: "PD009", prodName: "Sweatshirts", prodDesc: "Palestine sweater", prodCat: "Clothing", prodPrice: 17.5, prodSold: 70 },
  { prodID: "PD010", prodName: "Hoodies", prodDesc: "Fleece-lined hoodie", prodCat: "Clothing", prodPrice: 42.0, prodSold: 35 },
  { prodID: "PD011", prodName: "Pillow cases", prodDesc: "Morrocan print pillow case", prodCat: "Accessories", prodPrice: 17.0, prodSold: 40 },
  { prodID: "PD012", prodName: "Tote bags", prodDesc: "Canvas tote", prodCat: "Accessories", prodPrice: 24.0, prodSold: 22 },
  { prodID: "PD013", prodName: "Stickers", prodDesc: "Vinyl sticker pack", prodCat: "Accessories", prodPrice: 6.5, prodSold: 100 },
  { prodID: "PD014", prodName: "Posters", prodDesc: "Vibes printed poster", prodCat: "Home decor", prodPrice: 12.0, prodSold: 60 },
  { prodID: "PD015", prodName: "Framed posters", prodDesc: "Ready-to-hang frame", prodCat: "Home decor", prodPrice: 35.0, prodSold: 18 },
  { prodID: "PD016", prodName: "Canvas prints", prodDesc: "Gallery canvas wrap", prodCat: "Home decor", prodPrice: 55.0, prodSold: 14 }
];

export function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function getDataWithFallback(collectionName, localStorageKey, fallbackData) {
  const localData = JSON.parse(localStorage.getItem(localStorageKey) || "null");
  const fallback = localData || fallbackData;

  if (window.biztrackDb) {
    try {
      const snapshot = await window.biztrackDb.collection(collectionName).get();
      const remoteData = snapshot.docs.map((doc) => doc.data());

      if (remoteData.length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(remoteData));
        return remoteData;
      }
    } catch (error) {
      console.error("Failed to read " + collectionName + " from Firestore:", error);
    }
  }

  return fallback;
}
