import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';

import {
  Landing, Login, Register, Catalog, BookDetails, Profile,
  MemberDashboard, Recommendations, Payments,
  LibrarianSpace, Members, Issues,
  AdminDashboard, Users, Settings
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public API - Shared Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/:id" element={<BookDetails />} />
        </Route>

        {/* Protected Dashboard Features - Shared Left Navbar */}
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Universal Authenticated Features */}
          <Route path="/profile" element={<Profile />} />

          {/* Member Access */}
          <Route path="/dashboard" element={
            <RoleRoute allowedRoles={['MEMBER']}>
              <MemberDashboard />
            </RoleRoute>
          } />
          
          <Route path="/recommendations" element={
            <RoleRoute allowedRoles={['MEMBER']}>
              <Recommendations />
            </RoleRoute>
          } />

          <Route path="/payments" element={
            <RoleRoute allowedRoles={['MEMBER']}>
              <Payments />
            </RoleRoute>
          } />

          {/* Librarian Access */}
          <Route path="/librarian" element={
            <RoleRoute allowedRoles={['LIBRARIAN']}>
              <LibrarianSpace />
            </RoleRoute>
          } />
          <Route path="/members" element={
            <RoleRoute allowedRoles={['LIBRARIAN', 'ADMIN']}>
              <Members />
            </RoleRoute>
          } />
          <Route path="/issues" element={
            <RoleRoute allowedRoles={['LIBRARIAN', 'ADMIN']}>
              <Issues />
            </RoleRoute>
          } />

          {/* Admin Access */}
          <Route path="/admin" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          } />
          <Route path="/admin/users" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <Users />
            </RoleRoute>
          } />
          <Route path="/admin/settings" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <Settings />
            </RoleRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
