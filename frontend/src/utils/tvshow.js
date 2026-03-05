export function restructureEpisodes(input) {
  const output = {};

  for (const key in input) {
    const match = key.match(/^S(\d+)E(\d+)$/);
    if (!match) continue;

    const seasonKey = `Season ${Number(match[1])}`;
    const episodeKey = `Episode ${Number(match[2])}`;

    if (!output[seasonKey]) {
      output[seasonKey] = {};
    }

    output[seasonKey][episodeKey] = input[key];
  }

  return output;
}
