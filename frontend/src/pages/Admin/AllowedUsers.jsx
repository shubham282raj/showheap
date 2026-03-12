import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Stack } from "react-bootstrap";
import { getAllowedUsers, removeAllowedUser } from "../../apis/firebase";

export default function AllowedUsers() {
  const qc = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["allowedusers"],
    queryFn: getAllowedUsers,
  });

  const removeMutation = useMutation({
    mutationFn: removeAllowedUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allowedusers"] }),
  });

  return (
    <Stack gap={3}>
      {data?.length == 0 && (
        <div className="text-center">Nothing to show here</div>
      )}
      {data.map((u) => (
        <Card key={u.id}>
          <Card.Body>
            <Card.Title>{u.email}</Card.Title>

            <Card.Text className="mb-3">
              <strong>UID:</strong> {u.id}
              <br />
              <strong>Added:</strong>{" "}
              {u.created_at?.toDate?.().toLocaleString?.() || "-"}
            </Card.Text>

            <Button
              variant="danger"
              size="sm"
              onClick={() => removeMutation.mutate(u.id)}
              disabled={removeMutation.isPending}
            >
              Remove Access
            </Button>
          </Card.Body>
        </Card>
      ))}
    </Stack>
  );
}
