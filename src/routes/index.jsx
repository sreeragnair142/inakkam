import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Landing from "../pages/Landing";
import Auth from "../pages/Auth";
import Onboarding from "../pages/Onboarding";
import Home from "../pages/Home";
import Discover from "../pages/Discover";
import Explore from "../pages/Explore";
import Chat from "../pages/Chat";
import Membership from "../pages/Membership";
import Profile from "../pages/Profile";
import MainLayout from "../layouts/MainLayout";

// Wrapper to protect routes based on Redux auth status
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/swipe" replace /> : <Auth />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/landing" element={<Landing />} />

      {/* Onboarding (after login, before main app) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Protected Main Workspace Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Home />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/swipe"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Discover />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Explore />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Chat />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/membership"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Membership />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
