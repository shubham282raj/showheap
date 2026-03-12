import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onIdTokenChanged } from "firebase/auth";
import { showSuspense } from "../suspense/suspenseController";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hide = showSuspense("Authenticating");

    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      console.log("Auth state updated:", firebaseUser);

      setUser(firebaseUser);
      setLoading(false);
      hide();
    });

    return () => {
      unsubscribe();
      hide();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
