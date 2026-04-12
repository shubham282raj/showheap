import { db, auth } from "../firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  where,
  getCountFromServer,
  setDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

export const CONTENT_COLLECTION_NAME = "catalog";
export const METADATA_COLLECTION_NAME = "tgfiles";

export const getContent = async (imdb_id) => {
  const ref = doc(db, CONTENT_COLLECTION_NAME, imdb_id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Media Not Found in database");
  return snap.data();
};

export const getMetadata = async (imdb_id) => {
  const q = query(
    collection(db, METADATA_COLLECTION_NAME),
    where("imdb_id", "==", imdb_id),
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Not found");

  const data = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(data.length, "files found");

  const result = {};

  data.forEach((item) => {
    // MOVIE CASE
    if (item.media_type === "movie") {
      if (!result["Files"]) result["Files"] = [];
      result["Files"].push(item);
      return;
    }

    // SERIES CASE
    const season = `Season ${item.season}`;

    if (!result[season]) {
      result[season] = {};
    }

    item.episodes.forEach((ep) => {
      const episode = `Episode ${ep}`;

      if (!result[season][episode]) {
        result[season][episode] = [];
      }

      result[season][episode].push(item);
    });
  });

  return result;
};

export const fetchContent = async (lastVisibleDoc, PAGE_SIZE = 12) => {
  let q;

  if (lastVisibleDoc) {
    q = query(
      collection(db, CONTENT_COLLECTION_NAME),
      orderBy("updated_at", "desc"),
      startAfter(lastVisibleDoc),
      limit(PAGE_SIZE),
    );
  } else {
    q = query(
      collection(db, CONTENT_COLLECTION_NAME),
      orderBy("updated_at", "desc"),
      limit(PAGE_SIZE),
    );
  }

  const snapshot = await getDocs(q);

  return {
    docs: snapshot.docs,
    lastVisible:
      snapshot.docs.length < PAGE_SIZE
        ? null
        : snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

export const searchContentByName = async (name) => {
  const q = query(
    collection(db, CONTENT_COLLECTION_NAME),
    where("lower_name", ">=", name),
    where("lower_name", "<=", name + "\uf8ff"),
    limit(20),
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getCollectionCounts = async (collections) => {
  const results = await Promise.allSettled(
    collections.map((name) => getCountFromServer(collection(db, name))),
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value.data().count;
    }
    return null; // error → return null
  });
};

export const requestAccessWaitlist = async (uid, email) => {
  const ref = doc(db, "alloweduserwl", uid);

  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { already: true };
  }

  await setDoc(ref, {
    email,
    created_at: new Date(),
  });

  return { already: false };
};

// admin

export const getAllowedUsers = async () => {
  const snap = await getDocs(collection(db, "allowedusers"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getWaitlist = async () => {
  const snap = await getDocs(collection(db, "alloweduserwl"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const removeAllowedUser = async (uid) => {
  await deleteDoc(doc(db, "allowedusers", uid));
};

export const approveUser = async (uid) => {
  const wlRef = doc(db, "alloweduserwl", uid);
  const allowedRef = doc(db, "allowedusers", uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(wlRef);
    if (!snap.exists()) throw new Error("User not in waitlist");

    tx.set(allowedRef, snap.data());
    tx.delete(wlRef);
  });
};

export const isSuperUser = async () => {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const snap = await getDoc(doc(db, "superuser", user.uid));
    return snap.exists();
  } catch (e) {
    return false;
  }
};
