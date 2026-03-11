import { db } from "../firebase";
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
} from "firebase/firestore";

export const getContent = async (media_type, tmdb_id) => {
  const ref = doc(db, "content", `${media_type}_${tmdb_id}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Media Not Found in database");
  return snap.data();
};

export const getMetadata = async (file_id) => {
  const ref = doc(db, "metadata", file_id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Not found");
  return snap.data();
};

export const fetchContent = async (lastVisibleDoc, PAGE_SIZE = 12) => {
  let q;

  if (lastVisibleDoc) {
    q = query(
      collection(db, "content"),
      orderBy("updated_at", "desc"),
      startAfter(lastVisibleDoc),
      limit(PAGE_SIZE),
    );
  } else {
    q = query(
      collection(db, "content"),
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
    collection(db, "content"),
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
  const snaps = await Promise.all(
    collections.map((name) => getCountFromServer(collection(db, name))),
  );

  return snaps.map((snap) => snap.data().count);
};
