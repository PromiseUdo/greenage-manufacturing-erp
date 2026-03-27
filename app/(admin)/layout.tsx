"use client";

import * as React from "react";
import { Box, Toolbar } from "@mui/material";
import Topbar from "./components/topbar";
import Sidebar from "./components/sidebar";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box sx={{ display: "contents", "@media print": { display: "none" } }}>
        <Topbar />
        <Sidebar />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: "76px",
          px: 3,
          bgcolor: "background.default",
          "@media print": {
            pt: 0,
            px: 0,
            overflow: "visible",
            bgcolor: "white",
            maxWidth: "100%",
          },
        }}
      >
        {children}
      </Box>
    </Box>
    </NotificationProvider>
  );
}
