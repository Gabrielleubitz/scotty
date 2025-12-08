import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from './layout/AppShell';

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AppShell showSidebar={true}>
      {children || <Outlet />}
    </AppShell>
  );
};

