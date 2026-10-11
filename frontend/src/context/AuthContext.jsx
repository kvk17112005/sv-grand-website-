import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { apiRequest } from "../services/api";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [serviceError, setServiceError] = useState("");

  useEffect(() => {
    let active = true;
    localStorage.removeItem("svGrandCustomerPassword");
    localStorage.removeItem("svGrandLoggedIn");

    apiRequest("/api/auth/session")
      .then((payload) => {
        if (payload?.user === null) {
          if (active) {
            setUser(null);
            setStatus("ready");
            setServiceError("");
          }
          return;
        }

        if (!payload?.user) {
          throw new Error("The account service returned an invalid session response.");
        }

        if (active) {
          setUser(payload.user);
          setStatus("ready");
          setServiceError("");
        }
      })
      .catch((error) => {
        if (!active) return;

        if (error.status === 401) {
          setUser(null);
          setStatus("ready");
          setServiceError("");
          return;
        }

        setStatus("ready");
        setServiceError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (credentials) => {
    const payload = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (!payload?.user) {
      throw new Error("The account service returned an invalid sign-in response.");
    }

    setUser(payload.user);
    setServiceError("");
    return payload.user;
  };

  const register = async (details) => {
    const payload = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    });

    if (!payload?.user) {
      throw new Error("The account service returned an invalid registration response.");
    }

    setUser(payload.user);
    setServiceError("");
    return payload.user;
  };

  const signOut = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const updateProfile = async (details) => {
    const payload = await apiRequest("/api/account/profile", {
      method: "PUT",
      body: JSON.stringify(details),
    });

    if (!payload?.user) {
      throw new Error("The account service returned an invalid profile response.");
    }

    setUser(payload.user);
    return payload.user;
  };

  const changePassword = async (credentials) => {
    const payload = await apiRequest("/api/account/password", {
      method: "PUT",
      body: JSON.stringify(credentials),
    });
    return payload;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        serviceError,
        signIn,
        signOut,
        register,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
