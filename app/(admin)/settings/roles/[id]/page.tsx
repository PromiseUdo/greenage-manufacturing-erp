import { notFound } from "next/navigation";
import RoleForm from "../components/RoleForm";
import { prisma } from "@/lib/prisma";
import { Box, Typography } from "@mui/material";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const role = await prisma.role.findUnique({
    where: { id },
  });

  if (!role) {
    notFound();
  }

  return (
    <Box sx={{ p: 0, maxWidth: "1200px", margin: "0 auto", mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" mb={4}>
        Edit Role
      </Typography>
      <RoleForm initialData={role} />
    </Box>
  );
}
