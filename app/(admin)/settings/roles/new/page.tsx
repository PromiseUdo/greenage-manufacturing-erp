import RoleForm from "../components/RoleForm";
import { Box, Typography } from "@mui/material";

export default function NewRolePage() {
  return (
    <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
      <Typography variant="h6" fontWeight="bold" mb={4}>
        Create New Role
      </Typography>
      <RoleForm />
    </Box>
  );
}
