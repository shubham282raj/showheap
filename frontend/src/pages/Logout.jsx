import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signOutUser } from "../apis/auth";
import { showSuspense } from "../suspense/suspenseController";

export default function Logout() {
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    },
    onError: (e) => {
      toast.error(`Error: ${e.message}`);
      navigate("/", { replace: true });
    },
  });

  useEffect(() => {
    const hide = showSuspense("Logging You Out");

    logoutMutation.mutate();

    return hide;
  }, []);

  return null;
}
