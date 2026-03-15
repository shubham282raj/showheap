import { getAuth } from "firebase/auth";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const searchTMDBContentByName = async (queryType, queryParam, page) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken();

  const res = await fetch(
    `${baseUrl}/tmdb/search/${queryType}?query=${queryParam}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  ).then((res) => res.json());

  return res;
};
