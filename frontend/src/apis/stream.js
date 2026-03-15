import { getAuth } from "firebase/auth";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const fetchStreamingLink = async (encoded_metadata_id) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken();

  const res = await fetch(`${baseUrl}/getStreamURL/${encoded_metadata_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());

  return res;
};
