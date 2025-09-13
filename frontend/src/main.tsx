import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import Auth from "./pages/Auth.tsx";
import AuthHandler from "./components/AuthHandler.tsx";
import DashboardLayout from "./components/DashboardLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Jobs from "./pages/Jobs.tsx";
import CreateJob from "./pages/CreateJob.tsx";
import Logs from "./pages/Logs.tsx";
import Profile from "./pages/Profile.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route
            index
            element={
              <>
                <AuthHandler />
                <Dashboard />
              </>
            }
          />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/create" element={<CreateJob />} />
          <Route path="jobs/edit/:id" element={<CreateJob />} />
          <Route path="jobs/:id/logs" element={<Logs />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
