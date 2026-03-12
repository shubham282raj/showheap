import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Stack } from "react-bootstrap";
import { getWaitlist, approveUser } from "../../apis/firebase";

export default function Waitlist() {
  const qc = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["waitlist"],
    queryFn: getWaitlist,
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waitlist"] });
      qc.invalidateQueries({ queryKey: ["allowedusers"] });
    },
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
              <strong>Requested:</strong>{" "}
              {u.created_at?.toDate?.().toLocaleString?.() || "-"}
            </Card.Text>

            <Button
              variant="success"
              size="sm"
              onClick={() => approveMutation.mutate(u.id)}
              disabled={approveMutation.isPending}
            >
              Approve Access
            </Button>
          </Card.Body>
        </Card>
      ))}
    </Stack>
  );
}
