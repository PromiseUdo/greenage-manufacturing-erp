'use client';

import { useState, useEffect, useRef } from 'react';
import { useOrderContext } from '../layout';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  Divider,
  Paper,
  LinearProgress,
  Button,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FactoryIcon from '@mui/icons-material/Factory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

const formatDate = (d: string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const diffDays = (a: string | null, b: string | null) => {
  if (!a || !b) return 0;
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
  );
};

const stageStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#16A34A';
    case 'IN_PROGRESS':
      return '#2563EB';
    default:
      return '#9CA3AF';
  }
};

const toFrappeDate = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Progress values are pre-computed on the server (stage.progressPercent, action.progressPercent).
// No unit tracking data needed in the frontend — the units param is intentionally removed.
const buildGanttTasks = (stages: any[], orderStart: string): Task[] => {
  const tasks: Task[] = [];

  stages.forEach((stage) => {
    const stageId = `stage_${stage.id}`;

    // Ensure valid fallback dates for the stage
    const sStart = new Date(stage.scheduledStart || orderStart);
    let sEnd = new Date(stage.scheduledEnd || sStart);
    // Add 1 day if start and end are identical to prevent rendering zero-duration bars
    if (sStart.getTime() === sEnd.getTime()) {
      sEnd.setDate(sEnd.getDate() + 1);
    }

    tasks.push({
      id: stageId,
      name: `Stage ${stage.sortOrder}: ${stage.stageLabel.split(' (')[0]}`,
      start: sStart,
      end: sEnd,
      progress: stage.progressPercent ?? 0,
      type: 'project',
      hideChildren: false,
      styles: {
        progressColor: stageStatusColor(stage.status),
        progressSelectedColor: stageStatusColor(stage.status),
      },
    });

    // Add action items as child tasks
    stage.actionItems?.forEach((action: any, index: number) => {
      const aStart = new Date(action.scheduledStart || sStart);
      let aEnd = new Date(action.scheduledEnd || aStart);

      // Give it minimum visual width if identical dates
      if (aStart.getTime() === aEnd.getTime()) {
        aEnd.setDate(aEnd.getDate() + 1);
      }

      const aProgress = action.progressPercent ?? 0;

      const actionTaskId = `action_${action.id}`;
      // Define dependency on the previous action item within the stage
      const dependencies =
        index > 0 ? [`action_${stage.actionItems[index - 1].id}`] : [];

      const assignedTo =
        action.responsible?.name ||
        action.defaultResponsibility ||
        'Unassigned';

      tasks.push({
        id: actionTaskId,
        name: (action.actionName || '').replace(' (Custom)', ''),
        start: aStart,
        end: aEnd,
        progress: aProgress,
        type: 'task',
        project: stageId,
        dependencies,
        styles: {
          progressColor: stageStatusColor(action.status),
          progressSelectedColor: stageStatusColor(action.status),
        },
        // Custom attribute for tooltip
        assignedTo,
      } as any);
    });
  });

  return tasks;
};

const CustomTooltip = ({ task, fontSize, fontFamily }: any) => {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 2,
        borderRadius: 1,
        boxShadow:
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        fontFamily,
        fontSize: '13px',
        border: '1px solid',
        borderColor: 'divider',
        minWidth: 200,
        zIndex: 9999,
        position: 'relative',
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {task.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <b>Start:</b> {formatDate(task.start.toISOString())}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <b>End:</b> {formatDate(task.end.toISOString())}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <b>Progress:</b> {task.progress}%
      </Typography>
      {task.assignedTo && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" color="text.secondary">
            <b>Assigned To:</b> {task.assignedTo}
          </Typography>
        </>
      )}
    </Box>
  );
};

const CustomTaskListHeader = ({ headerHeight, fontFamily, fontSize }: any) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: headerHeight,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: 700,
        paddingLeft: '1rem',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: '#ffffff',
      }}
    >
      Task Name
    </Box>
  );
};

const CustomTaskListTable = ({
  rowHeight,
  rowWidth,
  fontFamily,
  fontSize,
  tasks,
  onExpanderClick,
}: any) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily,
        fontSize,
        width: rowWidth,
        bgcolor: '#ffffff',
      }}
    >
      {tasks.map((t: any, i: number) => {
        let expanderSymbol = '';
        if (t.hideChildren === false) {
          expanderSymbol = '▼';
        } else if (t.hideChildren === true) {
          expanderSymbol = '▶';
        }
        return (
          <Box
            key={`${t.id}row`}
            sx={{
              height: rowHeight,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: t.type === 'project' ? '0.5rem' : '1.5rem',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              onClick={() => onExpanderClick(t)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.2rem',
                marginRight: '0.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                color: 'text.secondary',
                fontSize: '10px',
              }}
            >
              {expanderSymbol}
            </Box>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontWeight: t.type === 'project' ? 600 : 400,
              }}
            >
              {t.name}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default function ProductionOrderOverviewPage() {
  const { order, loading } = useOrderContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={i}>
              <Skeleton height={100} variant="rounded" />
            </Grid>
          ))}
        </Grid>
        <Skeleton height={320} variant="rounded" />
      </Box>
    );
  }

  if (!order) return null;

  const qty = order.quantity;
  const passed = order.quantityPassed;
  const rejected = order.quantityRejected;
  const packaged = order.quantityPackaged;
  const yieldRate = order.yieldRate;
  const shortfall = (order as any).shortfallQuantity ?? 0;
  const hasShortfall = shortfall > 0;

  const kpis = [
    {
      label: 'Units Planned',
      value: qty,
      sub: 'quantity ordered',
      color: '#6366F1',
      bg: '#EEF2FF',
      icon: <FactoryIcon />,
    },
    {
      label: 'Units Passed QC',
      value: passed ?? '—',
      sub: passed !== null ? `of ${qty}` : 'no QC recorded',
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: <CheckCircleIcon />,
    },
    {
      label: 'Units Rejected',
      value: rejected ?? '—',
      sub: rejected !== null ? 'scrapped' : 'no rejection recorded',
      color: '#DC2626',
      bg: '#FEE2E2',
      icon: <CancelIcon />,
    },
    {
      label: 'Units Packaged',
      value: packaged ?? '—',
      sub: packaged !== null ? 'ready for store' : 'not yet packaged',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: <AllInclusiveIcon />,
    },
    {
      label: 'Yield Rate',
      value: yieldRate !== null ? `${yieldRate}%` : '—',
      sub:
        yieldRate !== null
          ? yieldRate >= 90
            ? 'Excellent'
            : yieldRate >= 75
              ? 'Acceptable'
              : 'Below Target'
          : 'pending QC',
      color:
        yieldRate === null
          ? '#6B7280'
          : yieldRate >= 90
            ? '#16A34A'
            : yieldRate >= 75
              ? '#D97706'
              : '#DC2626',
      bg:
        yieldRate === null
          ? '#F3F4F6'
          : yieldRate >= 90
            ? '#DCFCE7'
            : yieldRate >= 75
              ? '#FEF3C7'
              : '#FEE2E2',
      icon: <TrendingUpIcon />,
    },
    // Shortfall card — only shown when packaged < quantity
    ...(hasShortfall
      ? [
          {
            label: 'Shortfall',
            value: shortfall,
            sub: `units still needed`,
            color: '#B45309',
            bg: '#FEF3C7',
            icon: <WarningAmberIcon />,
          },
        ]
      : []),
  ];

  const ganttTasks = buildGanttTasks(order.stages, order.scheduledStart);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        width: '100%',
      }}
    >
      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, sm: 4, md: 12 / kpis.length }} key={kpi.label}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 2,
                  '&:last-child': { pb: 2 },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: kpi.bg,
                    color: kpi.color,
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" fontWeight={800} color={kpi.color}>
                    {kpi.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    display="block"
                    noWrap
                  >
                    {kpi.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {kpi.sub}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Order Details Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Schedule
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  {
                    label: 'Planned Start',
                    value: formatDate(order.scheduledStart),
                  },
                  {
                    label: 'Planned End',
                    value: formatDate(order.scheduledEnd),
                  },
                  {
                    label: 'Actual Start',
                    value: formatDate(order.actualStart) || 'Not started',
                  },
                  {
                    label: 'Actual End',
                    value: formatDate(order.actualEnd) || 'Ongoing',
                  },
                  {
                    label: 'Planned Duration',
                    value: `${diffDays(order.scheduledStart, order.scheduledEnd)} days`,
                  },
                  {
                    label: 'Priority',
                    value: order.priority,
                  },
                ].map((item) => (
                  <Grid size={{ xs: 6 }} key={item.label}>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Stage Summary
              </Typography>
              {order.stages.map((stage: any) => {
                const total =
                  (stage.actionItems?.length ?? 0) * (order.units?.length || 1);
                let done = 0;
                stage.actionItems?.forEach((a: any) => {
                  order.units?.forEach((u: any) => {
                    const t = u.stepTrackings?.find(
                      (tr: any) => tr.actionItemId === a.id,
                    );
                    if (
                      t &&
                      (t.status === 'COMPLETED' || t.status === 'SKIPPED')
                    ) {
                      done++;
                    }
                  });
                });
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Box key={stage.id} sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Stage {stage.sortOrder}:{' '}
                        {stage.stageLabel.split(' (')[0]}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {done}/{total}
                        </Typography>
                        <Chip
                          label={stage.status.replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            bgcolor:
                              stage.status === 'COMPLETED'
                                ? '#DCFCE7'
                                : stage.status === 'IN_PROGRESS'
                                  ? '#DBEAFE'
                                  : '#F3F4F6',
                            color:
                              stage.status === 'COMPLETED'
                                ? '#166534'
                                : stage.status === 'IN_PROGRESS'
                                  ? '#1E40AF'
                                  : '#6B7280',
                          }}
                        />
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          bgcolor: stageStatusColor(stage.status),
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gantt Chart */}
      {/* <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          width: "100%",
        }}
      >
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 1, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Production Gantt Chart
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant={viewMode === ViewMode.Day ? "contained" : "outlined"}
                  onClick={() => setViewMode(ViewMode.Day)}
                  sx={{ textTransform: "none", py: 0 }}
                >
                  Day
                </Button>
                <Button
                  size="small"
                  variant={
                    viewMode === ViewMode.Week ? "contained" : "outlined"
                  }
                  onClick={() => setViewMode(ViewMode.Week)}
                  sx={{ textTransform: "none", py: 0 }}
                >
                  Week
                </Button>
                <Button
                  size="small"
                  variant={
                    viewMode === ViewMode.Month ? "contained" : "outlined"
                  }
                  onClick={() => setViewMode(ViewMode.Month)}
                  sx={{ textTransform: "none", py: 0 }}
                >
                  Month
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                display: "block",
              }}
            >
              {ganttTasks.length > 0 ? (
                <Box sx={{ minWidth: isMobile ? 800 : 1000, pb: 2 }}>
                  <Gantt
                    tasks={ganttTasks}
                    viewMode={viewMode}
                    listCellWidth={isMobile ? "0px" : "320px"}
                    columnWidth={
                      viewMode === ViewMode.Month
                        ? 150
                        : viewMode === ViewMode.Week
                          ? 100
                          : 65
                    }
                    barBackgroundColor="#E5E7EB"
                    barProgressColor="#2563EB"
                    rowHeight={50}
                    fontSize="12px"
                    fontFamily="inherit"
                    todayColor="rgba(202, 211, 222, 0.4)"
                    preStepsCount={1}
                    TooltipContent={CustomTooltip}
                    TaskListHeader={CustomTaskListHeader}
                    TaskListTable={CustomTaskListTable}
                  />
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 6, textAlign: "center" }}
                >
                  No schedule data found for this order.
                </Typography>
              )}
            </Box>

            {order.notes && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2">{order.notes}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box> */}

    </Box>
  );
}
