import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthToken } from "../services/api";

export default function AuthHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Store the JWT token in localStorage
      setAuthToken(token);
      // Remove the token from the URL for security
      navigate("/dashboard", { replace: true });
    }
  }, [searchParams, navigate]);

  return null; // This component doesn't render anything
}
