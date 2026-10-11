
import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import TermsAndConditions from "./pages/TermsAndConditions";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import UserPanelPage from "./pages/UserPanelPage";
import HotelAdminPage from "./pages/HotelAdminPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import AuthProvider from "./context/AuthContext";
import { HotelProvider } from "./context/HotelContext";
import { getDashboardPath } from "./context/authRoles";
import { useAuth } from "./context/useAuth";

import { RoomDetailsModal } from "./components/outlineUser/RoomDetailsModal";
import { BookingCheckoutModal } from "./components/outlineUser/BookingCheckoutModal";
import { BookingSuccessModal } from "./components/outlineUser/BookingSuccessModal";
import { MyBookingsModal } from "./components/outlineUser/MyBookingsModal";
import { NotificationDrawer } from "./components/outlineCommon/NotificationDrawer";
import { ImageLightbox } from "./components/outlineCommon/ImageLightbox";
import { Toast } from "./components/outlineCommon/Toast";

function ProtectedRoute({ children, roles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <main className="account-message">Checking your account…</main>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ redirectTo: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

function AuthPage({ children }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <main className="account-message">Checking your account…</main>;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

function PublicHomeRoute() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <main className="account-message">Checking your account…</main>;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Home />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<PublicHomeRoute />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room/:type" element={<RoomDetails />} />
        <Route path="/terms/:type" element={<ProtectedRoute><TermsAndConditions /></ProtectedRoute>} />
        <Route path="/booking/:type" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route
          path="/booking-confirmation"
          element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>}
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<AuthPage><Login /></AuthPage>} />
        <Route path="/register" element={<AuthPage><Register /></AuthPage>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/user-portal" element={<ProtectedRoute><UserPanelPage /></ProtectedRoute>} />
        <Route path="/portal" element={<ProtectedRoute><UserPanelPage /></ProtectedRoute>} />
        <Route
          path="/hotel-admin"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <HotelAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>

      <Footer />

      {/* Global Modals & Overlays (from outline-sv-grand-) */}
      <RoomDetailsModal />
      <BookingCheckoutModal />
      <BookingSuccessModal />
      <MyBookingsModal />
      <NotificationDrawer />
      <ImageLightbox />
      <Toast />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <HotelProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </HotelProvider>
    </AuthProvider>
  );
}

export default App;
