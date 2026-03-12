import { useState } from "react";
import { Card, Container, Spinner } from "react-bootstrap";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Verification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const sendVerification = async () => {
    if (!user || sending) return;

    setSending(true);

    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const refreshStatus = async () => {
    if (checking) return;

    setChecking(true);

    try {
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        await auth.currentUser.getIdToken(true); // refresh token

        toast.success("Email verified!");
        navigate("/");
      } else {
        toast.error("Email still not verified");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Card style={{ width: "420px" }} className="shadow-sm border-0 py-2">
        <Card.Body>
          <Card.Title className="text-center mb-4">
            Verify Your Email
          </Card.Title>

          <div className="text-center text-muted mb-3">
            You must verify your email before using this website.
          </div>

          <div className="text-center mb-4">
            <strong>{user?.email}</strong>
          </div>

          <button
            className="w-100 btn bg-primary bg-opacity-25 mb-3"
            onClick={sendVerification}
            disabled={sending}
          >
            {sending ? (
              <>
                <Spinner size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              "Send Verification Email"
            )}
          </button>

          <button
            className="w-100 btn bg-secondary bg-opacity-25"
            onClick={refreshStatus}
            disabled={checking}
          >
            {checking ? (
              <>
                <Spinner size="sm" className="me-2" />
                Checking...
              </>
            ) : (
              "I Have Verified"
            )}
          </button>
        </Card.Body>
      </Card>
    </Container>
  );
}
