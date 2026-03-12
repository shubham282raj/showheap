import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";

export async function signIn(email, password) {
  if (!email || !password) {
    throw new Error("Incomplete credentials");
  }

  email = email.trim();
  password = String(password);

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    const errors = {
      "auth/invalid-email": "Invalid email format",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/invalid-credential": "Invalid email or password",
      "auth/user-disabled": "This account has been disabled",
      "auth/too-many-requests": "Too many attempts. Try again later",
      "auth/network-request-failed":
        "Network error. Check your internet connection",
    };

    const message = errors[error.code] || error.message || "Login failed";

    throw new Error(message);
  }
}

export async function register({ email, password }) {
  if (!email || !password) throw new Error("Incomplete credentials");

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    const errors = {
      "auth/email-already-in-use": "Email already registered",
      "auth/invalid-email": "Invalid email",
      "auth/weak-password": "Password must be at least 6 characters",
    };

    throw new Error(errors[error.code] || "Registration failed");
  }
}

export async function resetPassword(email) {
  if (!email) throw new Error("Email is required");

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const errors = {
      "auth/invalid-email": "Invalid email address",
      "auth/user-not-found": "No account found with this email",
      "auth/too-many-requests": "Too many attempts. Try later",
    };

    throw new Error(errors[error.code] || "Failed to send reset email");
  }
}
