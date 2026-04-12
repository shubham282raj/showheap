import { getAuth } from "firebase/auth";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const fetchStreamingLink = async (fild_id) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken();

  const res = await fetch(`${baseUrl}/getStreamURL/${fild_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.detail);
  }

  return await res.json();
};
