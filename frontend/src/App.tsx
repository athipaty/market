import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Browse } from "./pages/Browse";
import { CreateListing } from "./pages/CreateListing";
import { Inbox } from "./pages/Inbox";
import { ListingDetail } from "./pages/ListingDetail";
import { Login } from "./pages/Login";
import { MyListings } from "./pages/MyListings";
import { Register } from "./pages/Register";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route
          path="/listings/new"
          element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
