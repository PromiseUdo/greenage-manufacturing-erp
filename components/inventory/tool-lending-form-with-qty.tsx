// // src/components/inventory/tool-lending-form-with-qty.tsx

// 'use client';

// import {
//   Box,
//   TextField,
//   Button,
//   Paper,
//   Typography,
//   Autocomplete,
//   Chip,
//   Divider,
// } from '@mui/material';
// import Grid from '@mui/material/GridLegacy';
// import { useForm, Controller } from 'react-hook-form';
// import { useEffect, useState } from 'react';

// interface ToolOption {
//   id: string;
//   name: string;
//   toolId?: string;
//   groupNumber?: string;
//   availableQuantity: number;
//   isGroup: boolean;
//   category: string;
// }

// // Export interface to match what the component actually uses
// export interface ToolLendingFormData {
//   toolId: string;
//   quantity: number;
//   issuedTo: string;
//   department?: string;
//   purpose?: string;
//   projectName?: string;
//   orderId?: string;
//   expectedReturn?: string; // Keep as string for form, convert to Date in submit handler
// }

// interface ToolLendingFormProps {
//   onSubmit: (data: ToolLendingFormData) => Promise<void>;
//   onCancel: () => void;
//   isLoading?: boolean;
//   preselectedToolId?: string | null;
// }

// export default function ToolLendingFormWithQuantity({
//   onSubmit,
//   onCancel,
//   isLoading = false,
//   preselectedToolId,
// }: ToolLendingFormProps) {
//   const [tools, setTools] = useState<ToolOption[]>([]);
//   const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null);
//   const [loadingTools, setLoadingTools] = useState(false);

//   const {
//     control,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     watch,
//   } = useForm<ToolLendingFormData>({
//     defaultValues: {
//       toolId: '',
//       quantity: 1,
//       issuedTo: '',
//       department: '',
//       purpose: '',
//       projectName: '',
//       orderId: '',
//       expectedReturn: '',
//     },
//   });

//   const watchQuantity = watch('quantity');

//   useEffect(() => {
//     fetchAvailableTools();
//   }, []);

//   const fetchAvailableTools = async () => {
//     setLoadingTools(true);
//     try {
//       const res = await fetch('/api/inventory/tools/available');
//       const data = await res.json();
//       setTools(data.tools || []);

//       // Preselect tool if ID provided
//       if (preselectedToolId && data.tools) {
//         console.log(preselectedToolId, 'preselectedToolId');
//         console.log('====================================');
//         console.log(data?.tools);
//         console.log('====================================');

//         const preselected = data.tools.find(
//           (t: ToolOption) => t.id === preselectedToolId,
//         );
//         if (preselected) {
//           setSelectedTool(preselected);
//           setValue('toolId', preselected.id);
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching tools:', error);
//     } finally {
//       setLoadingTools(false);
//     }
//   };

//   const handleToolChange = (tool: ToolOption | null) => {
//     setSelectedTool(tool);
//     if (tool) {
//       setValue('toolId', tool.id);
//       setValue('quantity', 1);
//     }
//   };

//   return (
//     <Paper sx={{ p: 3 }}>
//       {/* <Typography variant="h6" fontWeight={600} gutterBottom>
//         Issue Tool / Equipment
//       </Typography>
//       <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//         Record tool issuance to a team member or department
//       </Typography> */}

//       <Box component="form" onSubmit={handleSubmit(onSubmit)}>
//         <Grid container spacing={3}>
//           {/* Tool Selection */}
//           <Grid item xs={12}>
//             <Controller
//               name="toolId"
//               control={control}
//               rules={{ required: 'Please select a tool' }}
//               render={({ field }) => (
//                 <Autocomplete
//                   options={tools}
//                   loading={loadingTools}
//                   value={selectedTool}
//                   getOptionLabel={(option) =>
//                     option.isGroup
//                       ? `${option.name} (Group: ${option.availableQuantity} available)`
//                       : `${option.name} - ${option.toolId}`
//                   }
//                   renderOption={(props, option) => {
//                     const { key, ...otherProps } = props;

//                     return (
//                       <Box component="li" key={key} {...otherProps}>
//                         <Box sx={{ width: '100%' }}>
//                           <Box
//                             sx={{
//                               display: 'flex',
//                               justifyContent: 'space-between',
//                               alignItems: 'center',
//                             }}
//                           >
//                             <Typography variant="body2" fontWeight={500}>
//                               {option.name}
//                             </Typography>

//                             {option.isGroup && (
//                               <Chip
//                                 label="GROUP"
//                                 size="small"
//                                 sx={{
//                                   bgcolor: '#f3e5f5',
//                                   color: '#9c27b0',
//                                   fontSize: 10,
//                                 }}
//                               />
//                             )}
//                           </Box>

//                           <Box
//                             sx={{
//                               display: 'flex',
//                               gap: 1,
//                               alignItems: 'center',
//                               mt: 0.5,
//                             }}
//                           >
//                             <Typography
//                               variant="caption"
//                               color="text.secondary"
//                             >
//                               {option.isGroup
//                                 ? option.groupNumber
//                                 : option.toolId}
//                             </Typography>

//                             <Chip
//                               label={`${option.availableQuantity} available`}
//                               size="small"
//                               sx={{
//                                 fontSize: 10,
//                                 height: 20,
//                                 bgcolor: '#e8f5e9',
//                                 color: '#2e7d32',
//                               }}
//                             />
//                           </Box>
//                         </Box>
//                       </Box>
//                     );
//                   }}
//                   onChange={(_, value) => handleToolChange(value)}
//                   renderInput={(params) => (
//                     <TextField
//                       {...params}
//                       label="Select Tool"
//                       variant="standard"
//                       required
//                       error={!!errors.toolId}
//                       helperText={
//                         errors.toolId?.message ||
//                         'Search by tool name or number'
//                       }
//                     />
//                   )}
//                 />
//               )}
//             />
//           </Grid>

//           {/* Quantity - Show if tool is selected */}
//           {selectedTool && (
//             <Grid item xs={12} md={6}>
//               <Controller
//                 name="quantity"
//                 control={control}
//                 rules={{
//                   required: 'Quantity is required',
//                   min: { value: 1, message: 'Minimum quantity is 1' },
//                   max: {
//                     value: selectedTool.availableQuantity,
//                     message: `Maximum available is ${selectedTool.availableQuantity}`,
//                   },
//                 }}
//                 render={({ field }) => (
//                   <TextField
//                     {...field}
//                     label="Quantity"
//                     type="number"
//                     fullWidth
//                     variant="standard"
//                     required
//                     disabled={!selectedTool.isGroup}
//                     error={!!errors.quantity}
//                     helperText={
//                       errors.quantity?.message ||
//                       (selectedTool.isGroup
//                         ? `Available: ${selectedTool.availableQuantity}`
//                         : 'Single tool - quantity locked at 1')
//                     }
//                     InputProps={{
//                       inputProps: {
//                         min: 1,
//                         max: selectedTool.availableQuantity,
//                       },
//                     }}
//                     onChange={(e) =>
//                       field.onChange(
//                         e.target.value ? parseInt(e.target.value) : 1,
//                       )
//                     }
//                   />
//                 )}
//               />
//             </Grid>
//           )}

//           {/* <Grid item xs={12}>
//             <Divider />
//           </Grid> */}

//           {/* Issued To */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="issuedTo"
//               control={control}
//               rules={{ required: 'Recipient name is required' }}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Issued To"
//                   fullWidth
//                   required
//                   variant="standard"
//                   error={!!errors.issuedTo}
//                   helperText={
//                     errors.issuedTo?.message ||
//                     'Name of person receiving the tool(s)'
//                   }
//                   placeholder="e.g., John Doe"
//                 />
//               )}
//             />
//           </Grid>

//           {/* Department */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="department"
//               control={control}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Department"
//                   fullWidth
//                   variant="standard"
//                   helperText="Department or team"
//                   placeholder="e.g., Electrical, Mechanical"
//                 />
//               )}
//             />
//           </Grid>

//           {/* Project Name */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="projectName"
//               control={control}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Project Name"
//                   fullWidth
//                   variant="standard"
//                   helperText="Associated project if any"
//                   placeholder="e.g., Building A Renovation"
//                 />
//               )}
//             />
//           </Grid>

//           {/* Order ID */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="orderId"
//               control={control}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Order/Work Order ID"
//                   fullWidth
//                   variant="standard"
//                   helperText="Related order number"
//                   placeholder="e.g., WO-12345"
//                 />
//               )}
//             />
//           </Grid>

//           {/* Purpose */}
//           <Grid item xs={12}>
//             <Controller
//               name="purpose"
//               control={control}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Purpose"
//                   fullWidth
//                   variant="standard"
//                   multiline
//                   rows={2}
//                   helperText="Describe what the tool(s) will be used for"
//                   placeholder="e.g., Wire installation for new electrical panel"
//                 />
//               )}
//             />
//           </Grid>

//           {/* Expected Return */}
//           <Grid item xs={12} md={6}>
//             <Controller
//               name="expectedReturn"
//               control={control}
//               render={({ field }) => (
//                 <TextField
//                   {...field}
//                   label="Expected Return Date"
//                   type="date"
//                   fullWidth
//                   variant="standard"
//                   InputLabelProps={{ shrink: true }}
//                   helperText="When should the tool(s) be returned?"
//                 />
//               )}
//             />
//           </Grid>

//           {/* Summary */}
//           {selectedTool && watchQuantity > 0 && (
//             <Grid item xs={12}>
//               <Paper
//                 elevation={0}
//                 sx={{
//                   p: 2,
//                   bgcolor: '#f8fafc',
//                   border: '1px solid',
//                   borderColor: 'divider',
//                   borderRadius: 1,
//                 }}
//               >
//                 <Typography variant="body2" fontWeight={600} gutterBottom>
//                   Summary
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   Issuing <strong>{watchQuantity}</strong>{' '}
//                   {watchQuantity === 1 ? 'unit' : 'units'} of{' '}
//                   <strong>{selectedTool.name}</strong>
//                 </Typography>
//               </Paper>
//             </Grid>
//           )}

//           {/* Action Buttons */}
//           <Grid item xs={12}>
//             <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
//               <Button
//                 variant="outlined"
//                 onClick={onCancel}
//                 disabled={isLoading}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 sx={{
//                   minWidth: 140,
//                   bgcolor: '#0F172A',
//                   fontWeight: 'bold',
//                   '&:hover': { bgcolor: '#1e293b' },
//                 }}
//                 type="submit"
//                 variant="contained"
//                 disabled={isLoading || !selectedTool}
//               >
//                 {isLoading
//                   ? 'Processing...'
//                   : `Issue ${watchQuantity > 1 ? `${watchQuantity} Tools` : 'Tool'}`}
//               </Button>
//             </Box>
//           </Grid>
//         </Grid>
//       </Box>
//     </Paper>
//   );
// }

// src/components/inventory/tool-lending-form-with-qty.tsx - ENHANCED

'use client';

import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Autocomplete,
  Chip,
  Divider,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Alert,
  Collapse,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';

interface ToolOption {
  id: string;
  name: string;
  toolId?: string;
  groupNumber?: string;
  availableQuantity: number;
  isGroup: boolean;
  category: string;
  availableTools?: IndividualTool[]; // For groups
}

interface IndividualTool {
  id: string;
  toolId: string;
  condition: string;
  location?: string;
}

// Export interface to match what the component actually uses
export interface ToolLendingFormData {
  toolId: string; // Group ID or individual tool ID
  quantity: number;
  selectedToolIds?: string[]; // NEW: Specific tool IDs for groups
  issuedTo: string;
  department?: string;
  purpose?: string;
  projectName?: string;
  orderId?: string;
  expectedReturn?: string;
}

interface ToolLendingFormProps {
  onSubmit: (data: ToolLendingFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedToolId?: string | null;
  groupToolId?: string | null;
}

export default function ToolLendingFormWithQuantity({
  onSubmit,
  onCancel,
  isLoading = false,
  preselectedToolId,
  groupToolId,
}: ToolLendingFormProps) {
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [showToolSelection, setShowToolSelection] = useState(false);

  console.log(preselectedToolId, 'preselectedToolId');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<ToolLendingFormData>({
    defaultValues: {
      toolId: '',
      quantity: 1,
      selectedToolIds: [],
      issuedTo: '',
      department: '',
      purpose: '',
      projectName: '',
      orderId: '',
      expectedReturn: '',
    },
  });

  const watchQuantity = watch('quantity');
  const watchedToolId = watch('toolId');

  useEffect(() => {
    fetchAvailableTools();
  }, []);

  useEffect(() => {
    if (!watchedToolId || tools.length === 0) return;

    const tool = tools.find((t) => t.id === watchedToolId);
    if (!tool) return;

    setSelectedTool(tool);

    if (tool.isGroup) {
      fetchGroupTools(tool.id);
      setShowToolSelection(true);
    } else {
      setShowToolSelection(false);
    }
  }, [watchedToolId, tools]);

  const fetchAvailableTools = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('/api/inventory/tools/available');
      const data = await res.json();
      setTools(data.tools || []);

      // console.log(data.tools, 'available tools');

      if (preselectedToolId && data.tools) {
        const preselected = data.tools.find(
          (t: ToolOption) => t.id === preselectedToolId,
        );
        // if (preselected) {
        //   setSelectedTool(preselected);
        //   setValue('toolId', preselected.id);
        // }

        console.log(preselected, 'presekected');

        if (preselected) {
          setValue('toolId', preselected.id);
        }
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoadingTools(false);
    }
  };

  const handleToolChange = async (tool: ToolOption | null) => {
    setSelectedTool(tool);
    setSelectedToolIds([]);
    setShowToolSelection(false);
    clearErrors('quantity');

    if (tool) {
      setValue('toolId', tool.id);
      setValue('quantity', 1);

      // If it's a group, fetch individual tools
      if (tool.isGroup) {
        await fetchGroupTools(tool.id);
      }
    }
  };

  const fetchGroupTools = async (groupId: string) => {
    try {
      const res = await fetch(
        `/api/inventory/tools/groups/${groupId}/available`,
      );
      const data = await res.json();

      if (data.availableTools) {
        setSelectedTool((prev) =>
          prev
            ? {
                ...prev,
                availableTools: data.availableTools,
              }
            : null,
        );
      }
    } catch (error) {
      console.error('Error fetching group tools:', error);
    }
  };

  useEffect(() => {
    if (
      !selectedTool?.isGroup ||
      !selectedTool.availableTools ||
      !groupToolId
    ) {
      return;
    }

    // Check if preselectedToolId is one of the group tools
    const existsInGroup = selectedTool.availableTools.some(
      (t) => t.id === groupToolId,
    );

    if (!existsInGroup) return;

    // Prevent re-running
    if (selectedToolIds.includes(groupToolId)) return;

    const newSelection = [groupToolId];

    setSelectedToolIds(newSelection);
    setValue('selectedToolIds', newSelection);
    setValue('quantity', 1);
    setShowToolSelection(true);
  }, [selectedTool?.availableTools]);

  // console.log(selectedTool, 'selectedtool');

  const handleToolSelect = (toolId: string, checked: boolean) => {
    let newSelection: string[];

    if (checked) {
      newSelection = [...selectedToolIds, toolId];
    } else {
      newSelection = selectedToolIds.filter((id) => id !== toolId);
    }

    setSelectedToolIds(newSelection);
    setValue('selectedToolIds', newSelection);
    setValue('quantity', newSelection.length);

    // Clear quantity error when tools are selected
    if (newSelection.length > 0) {
      clearErrors('quantity');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!selectedTool?.availableTools) return;

    if (checked) {
      const allIds = selectedTool.availableTools.map((t) => t.id);
      setSelectedToolIds(allIds);
      setValue('selectedToolIds', allIds);
      setValue('quantity', allIds.length);
      clearErrors('quantity');
    } else {
      setSelectedToolIds([]);
      setValue('selectedToolIds', []);
      setValue('quantity', 0);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
      case 'GOOD':
        return '#2e7d32';
      case 'FAIR':
        return '#ed6c02';
      case 'POOR':
      case 'NEEDS_REPAIR':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const handleFormSubmit = (data: ToolLendingFormData) => {
    // Validate group tool selection
    if (selectedTool?.isGroup && selectedToolIds.length === 0) {
      setError('quantity', {
        type: 'manual',
        message: 'Please select at least one tool from the group',
      });
      return;
    }

    // Add selected tool IDs to form data
    const submitData = {
      ...data,
      selectedToolIds: selectedTool?.isGroup ? selectedToolIds : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* <Typography variant="h6" fontWeight={600} gutterBottom>
        Issue Tool / Equipment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Record tool issuance to a team member or department
      </Typography> */}

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={3}>
          {/* Tool Selection */}
          <Grid item xs={12}>
            <Controller
              name="toolId"
              control={control}
              rules={{ required: 'Please select a tool' }}
              render={({ field }) => (
                <Autocomplete
                  options={tools}
                  loading={loadingTools}
                  value={selectedTool}
                  getOptionLabel={(option) =>
                    option.isGroup
                      ? `${option.name} (Group: ${option.availableQuantity} available)`
                      : `${option.name} - ${option.toolId}`
                  }
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;

                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Box sx={{ width: '100%' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              {option.name}
                            </Typography>

                            {option.isGroup && (
                              <Chip
                                label="GROUP"
                                size="small"
                                sx={{
                                  bgcolor: '#f3e5f5',
                                  color: '#9c27b0',
                                  fontSize: 10,
                                }}
                              />
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'center',
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.isGroup
                                ? option.groupNumber
                                : option.toolId}
                            </Typography>

                            <Chip
                              label={`${option.availableQuantity} available`}
                              size="small"
                              sx={{
                                fontSize: 10,
                                height: 20,
                                bgcolor: '#e8f5e9',
                                color: '#2e7d32',
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    );
                  }}
                  // renderOption={(props, option) => (
                  //   <Box component="li" {...props}>
                  //     <Box sx={{ width: '100%' }}>
                  //       <Box
                  //         sx={{
                  //           display: 'flex',
                  //           justifyContent: 'space-between',
                  //           alignItems: 'center',
                  //         }}
                  //       >
                  //         <Typography variant="body2" fontWeight={500}>
                  //           {option.name}
                  //         </Typography>
                  //         {option.isGroup && (
                  //           <Chip
                  //             label="GROUP"
                  //             size="small"
                  //             sx={{
                  //               bgcolor: '#f3e5f5',
                  //               color: '#9c27b0',
                  //               fontSize: 10,
                  //             }}
                  //           />
                  //         )}
                  //       </Box>
                  //       <Box
                  //         sx={{
                  //           display: 'flex',
                  //           gap: 1,
                  //           alignItems: 'center',
                  //           mt: 0.5,
                  //         }}
                  //       >
                  //         <Typography variant="caption" color="text.secondary">
                  //           {option.isGroup
                  //             ? option.groupNumber
                  //             : option.toolId}
                  //         </Typography>
                  //         <Chip
                  //           label={`${option.availableQuantity} available`}
                  //           size="small"
                  //           sx={{
                  //             fontSize: 10,
                  //             height: 20,
                  //             bgcolor: '#e8f5e9',
                  //             color: '#2e7d32',
                  //           }}
                  //         />
                  //       </Box>
                  //     </Box>
                  //   </Box>
                  // )}
                  onChange={(_, value) => handleToolChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Tool"
                      variant="standard"
                      required
                      error={!!errors.toolId}
                      helperText={
                        errors.toolId?.message ||
                        'Search by tool name or number'
                      }
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Group Tool Selection */}
          {selectedTool?.isGroup && selectedTool.availableTools && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderColor: 'divider',

                    bgcolor: '#f8fafc',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Select Tools to Issue
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choose specific tools from this group (
                      {selectedToolIds.length} selected)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={
                      showToolSelection ? <CollapseIcon /> : <ExpandIcon />
                    }
                    onClick={() => setShowToolSelection(!showToolSelection)}
                  >
                    {showToolSelection ? 'Hide' : 'Show'} Tools
                  </Button>
                </Box>

                <Collapse in={showToolSelection}>
                  <Box sx={{ p: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            selectedToolIds.length ===
                              selectedTool.availableTools?.length &&
                            selectedToolIds.length > 0
                          }
                          indeterminate={
                            selectedToolIds.length > 0 &&
                            selectedToolIds.length <
                              (selectedTool.availableTools?.length || 0)
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={600}>
                          Select All
                        </Typography>
                      }
                    />

                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell>
                              <strong>Tool ID</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Condition</strong>
                            </TableCell>
                            <TableCell>
                              <strong>Location</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTool.availableTools.map((tool) => (
                            <TableRow
                              key={tool.id}
                              hover
                              onClick={() =>
                                handleToolSelect(
                                  tool.id,
                                  !selectedToolIds.includes(tool.id),
                                )
                              }
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedToolIds.includes(tool.id)}
                                  onChange={(e) =>
                                    handleToolSelect(tool.id, e.target.checked)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={tool.toolId}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 500, fontSize: 11 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: getConditionColor(tool.condition),
                                    fontWeight: 500,
                                  }}
                                >
                                  {tool.condition.replace(/_/g, ' ')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {tool.location || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {errors.quantity && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {errors.quantity.message}
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </Grid>
          )}

          {/* Quantity Display for Groups */}
          {selectedTool?.isGroup && (
            <Grid item xs={12} md={6}>
              <TextField
                label="Quantity"
                value={selectedToolIds.length}
                fullWidth
                variant="standard"
                disabled
                helperText={`${selectedToolIds.length} tool(s) selected from group`}
              />
            </Grid>
          )}

          {/* Quantity for Standalone Tools */}
          {selectedTool && !selectedTool.isGroup && (
            <Grid item xs={12} md={6}>
              <TextField
                label="Quantity"
                value={1}
                fullWidth
                variant="standard"
                disabled
                helperText="Single tool - quantity locked at 1"
              />
            </Grid>
          )}

          {/* <Grid item xs={12}>
            <Divider />
          </Grid> */}

          {/* Rest of the form fields remain the same... */}
          <Grid item xs={12} md={6}>
            <Controller
              name="issuedTo"
              control={control}
              rules={{ required: 'Recipient name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issued To"
                  fullWidth
                  required
                  variant="standard"
                  error={!!errors.issuedTo}
                  helperText={
                    errors.issuedTo?.message ||
                    'Name of person receiving the tool(s)'
                  }
                  placeholder="e.g., John Doe"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Department"
                  fullWidth
                  variant="standard"
                  helperText="Department or team"
                  placeholder="e.g., Electrical, Mechanical"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="projectName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Project Name"
                  fullWidth
                  variant="standard"
                  helperText="Associated project if any"
                  placeholder="e.g., Building A Renovation"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="orderId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Order/Work Order ID"
                  fullWidth
                  variant="standard"
                  helperText="Related order number"
                  placeholder="e.g., WO-12345"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="purpose"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Purpose"
                  fullWidth
                  variant="standard"
                  multiline
                  rows={2}
                  helperText="Describe what the tool(s) will be used for"
                  placeholder="e.g., Wire installation for new electrical panel"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="expectedReturn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Expected Return Date"
                  type="date"
                  fullWidth
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  helperText="When should the tool(s) be returned?"
                />
              )}
            />
          </Grid>

          {/* Summary */}
          {selectedTool && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Issuing{' '}
                  <strong>
                    {selectedTool.isGroup ? selectedToolIds.length : 1}
                  </strong>{' '}
                  {selectedTool.isGroup && selectedToolIds.length === 1
                    ? 'unit'
                    : 'units'}{' '}
                  of <strong>{selectedTool.name}</strong>
                  {selectedTool.isGroup && selectedToolIds.length > 0 && (
                    <Box component="span" sx={{ display: 'block', mt: 1 }}>
                      Tool IDs:{' '}
                      {selectedTool.availableTools
                        ?.filter((t) => selectedToolIds.includes(t.id))
                        .map((t) => t.toolId)
                        .join(', ')}
                    </Box>
                  )}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                sx={{
                  minWidth: 140,
                  bgcolor: '#0F172A',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
                type="submit"
                variant="contained"
                disabled={
                  isLoading ||
                  !selectedTool ||
                  (selectedTool.isGroup && selectedToolIds.length === 0)
                }
              >
                {isLoading
                  ? 'Processing...'
                  : selectedTool?.isGroup
                    ? `Issue ${selectedToolIds.length} Tool${selectedToolIds.length !== 1 ? 's' : ''}`
                    : 'Issue Tool'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
