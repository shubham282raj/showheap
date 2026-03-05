const baseUrl = import.meta.env.VITE_BASE_URL;

export const searchTMDBContentByName = async (queryType, queryParam, page) => {
  const res = await fetch(
    `${baseUrl}/tmdb/search/${queryType}?query=${queryParam}&page=${page}`,
  ).then((res) => res.json());
  console.log(res);
  return res;
};
