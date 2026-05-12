const firebaseConfig = {
  apiKey: "AIzaSyAPvWqcw0L2Wei64mlugdm5H9ZivClxM-M",
  authDomain: "biztrack-cloud.firebaseapp.com",
  projectId: "biztrack-cloud",
  storageBucket: "biztrack-cloud.firebasestorage.app",
  messagingSenderId: "647727338257",
  appId: "1:647727338257:web:76c413cd82b4f835ffb2b0",
  measurementId: "G-8RF7KHZN56",
};

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.biztrackDb = window.firebase ? firebase.firestore() : null;
window.biztrackCollections = {
  products: "products",
  orders: "orders",
  expenses: "expenses",
  activityLogs: "activity_logs",
};

async function replaceCollection(collectionName, items, idField) {
  if (!window.biztrackDb) {
    return;
  }

  const collectionRef = window.biztrackDb.collection(collectionName);
  const snapshot = await collectionRef.get();
  const batch = window.biztrackDb.batch();

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  items.forEach((item, index) => {
    const docId = item[idField] ? String(item[idField]) : String(index + 1);
    batch.set(collectionRef.doc(docId), item);
  });

  await batch.commit();
}

async function logActivity(entity, action, recordId, changedData, beforeData) {
  if (!window.biztrackDb) {
    return;
  }

  const isoNow = new Date().toISOString();

  await window.biztrackDb.collection(window.biztrackCollections.activityLogs).add({
    entity,
    entityType: entity,
    action,
    recordId: String(recordId || ""),
    entityId: String(recordId || ""),
    changedData: changedData || {},
    afterData: changedData || {},
    beforeData: beforeData || {},
    changedAt: isoNow,
    clientTime: isoNow,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

window.biztrackDbHelpers = {
  isReady() {
    return Boolean(window.biztrackDb);
  },
  syncCollection(collectionKey, items, idField) {
    const collectionName = window.biztrackCollections[collectionKey];
    if (!collectionName) {
      return Promise.resolve();
    }
    return replaceCollection(collectionName, items, idField);
  },
  logActivity,
};

async function bootstrapAllCollectionsFromLocalStorage() {
  if (!window.biztrackDbHelpers.isReady()) {
    return;
  }

  const collections = [
    { collectionKey: "products", localKey: "bizTrackProducts", idField: "prodID" },
    { collectionKey: "orders", localKey: "bizTrackOrders", idField: "orderID" },
    { collectionKey: "expenses", localKey: "bizTrackTransactions", idField: "trID" },
  ];

  for (const { collectionKey, localKey, idField } of collections) {
    try {
      const firestoreName = window.biztrackCollections[collectionKey];
      if (!firestoreName) continue;

      const snapshot = await window.biztrackDb.collection(firestoreName).get();
      const remoteData = [];
      snapshot.forEach((doc) => {
        remoteData.push(doc.data());
      });

      if (remoteData.length > 0) {
        localStorage.setItem(localKey, JSON.stringify(remoteData));
        continue;
      }

      const raw = localStorage.getItem(localKey);
      const localItems = raw ? JSON.parse(raw) : [];
      if (Array.isArray(localItems) && localItems.length > 0) {
        await window.biztrackDbHelpers.syncCollection(collectionKey, localItems, idField);
      }
    } catch (error) {
      console.error("Initial Firestore bootstrap failed (" + collectionKey + "):", error);
    }
  }
}

window.addEventListener("load", () => {
  bootstrapAllCollectionsFromLocalStorage();
});
