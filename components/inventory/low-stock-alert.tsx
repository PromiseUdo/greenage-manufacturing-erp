// src/components/inventory/LowStockAlert.tsx

'use client';

import {
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { StockAlert } from '@/types/inventory';
import { useRouter } from 'next/navigation';

interface LowStockAlertProps {
  alerts: StockAlert[];
}

export default function LowStockAlert({ alerts }: LowStockAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  if (alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter((a) => a.alertType === 'OUT_OF_STOCK');
  const warningAlerts = alerts.filter((a) => a.alertType === 'LOW_STOCK');

  return (
    <Box
      sx={{
        mb: 3,
        // borderRadius: 1,
        // borderColor: 'divider',
        // borderWidth: !expanded ? 1 : 0,
        // borderStyle: 'solid',
      }}
    >
      <Alert
        severity="warning"
        action={
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        }
      >
        {/* <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <AlertTitle
            sx={{
              fontSize: 14,
              mb: 0, 
              lineHeight: 1.2,
            }}
          >
            Stock Alerts
          </AlertTitle> */}

        {/* B */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {criticalAlerts.length > 0 && (
            <Chip
              label={`${criticalAlerts.length} Out of Stock`}
              color="error"
              size="small"
              sx={{ fontSize: 11 }}
            />
          )}
          {warningAlerts.length > 0 && (
            <Chip
              label={`${warningAlerts.length} Low Stock`}
              color="warning"
              size="small"
              sx={{ fontSize: 11 }}
            />
          )}
        </Box>
        {/* </Box> */}
      </Alert>

      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 2,
            p: 0,
            border: '0.5px solid',
            borderColor: 'warning.light',
            borderRadius: 1,
            backgroundColor: 'background.paper',
          }}
        >
          <List dense>
            {alerts.map((alert) => (
              <ListItem
                key={alert.materialId}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
                secondaryAction={
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: 'uppercase',
                      borderColor: '#0F172A',
                      color: '#0F172A',
                    }}
                    onClick={() =>
                      router.push(`/inventory/materials/${alert.materialId}`)
                    }
                  >
                    View
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <strong>{alert.materialName}</strong>
                      <Chip
                        label={alert.partNumber}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                      <Chip
                        label={
                          alert.alertType === 'OUT_OF_STOCK'
                            ? 'Out of Stock'
                            : 'Low Stock'
                        }
                        color={alert.severity}
                        size="small"
                        sx={{ fontSize: 11 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box
                      component="span"
                      sx={{ mt: 0.5, display: 'block', fontSize: 12 }}
                    >
                      Current Stock: <strong>{alert.currentStock}</strong> |
                      Reorder Level: <strong>{alert.reorderLevel}</strong>
                      {alert.alertType === 'OUT_OF_STOCK' && (
                        <Box
                          component="span"
                          sx={{ ml: 1, color: 'error.main', fontWeight: 600 }}
                        >
                          Immediate action required
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
}
