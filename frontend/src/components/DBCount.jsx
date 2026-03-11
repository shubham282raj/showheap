import { useQuery } from "@tanstack/react-query";
import { getCollectionCounts } from "../apis/firebase";

export default function DBCount() {
  const { data: [contentCount, metadataCount] = [], isSuccess } = useQuery({
    queryKey: ["dbcount"],
    queryFn: () => getCollectionCounts(["content", "metadata"]),
  });

  if (!isSuccess) return null;

  return (
    <div className="text-center my-3">
      {metadataCount} files across {contentCount} movies & shows
      <br></br>
      All ready to stream.
    </div>
  );
}
