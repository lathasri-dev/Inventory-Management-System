import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Stack,
  Tooltip,
  Chip,
  Skeleton,
  TablePagination,
  InputAdornment,
  Alert,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../services/api';
import { normalizeRole, ROLE_IDS } from '../utils/roles';

export default function Categories() {
  const { user } = useSelector((state) => state.auth);
  const role = normalizeRole(user?.role);
  const canModify = [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER].includes(role);

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [total, setTotal] = useState(0);

  // Form Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', color: '#1976d2', icon: 'category', sortOrder: 0 });
  const [formError, setFormError] = useState('');

  // View details dialog
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewCategory, setViewCategory] = useState(null);

  // Delete confirm dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [selectedDeleteName, setSelectedDeleteName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getAll({
        search,
        page: page + 1,
        limit: rowsPerPage,
      });
      if (res.success) {
        setCategories(res.data || []);
        setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [search, page, rowsPerPage]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Reset page to 0 when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', image: '', color: '#1976d2', icon: 'category', sortOrder: 0 });
    setFormError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      color: cat.color || '#1976d2',
      icon: cat.icon || 'category',
      sortOrder: cat.sortOrder ?? 0,
    });
    setFormError('');
    setOpenDialog(true);
  };

  const handleOpenView = async (cat) => {
    try {
      const res = await categoriesAPI.getById(cat._id);
      if (res.success) {
        setViewCategory(res.data);
        setOpenViewDialog(true);
      }
    } catch {
      setViewCategory(cat);
      setOpenViewDialog(true);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (editingCategory) {
        const res = await categoriesAPI.update(editingCategory._id, form);
        if (res.success) {
          toast.success('Category updated successfully');
          loadCategories();
          setOpenDialog(false);
        }
      } else {
        const res = await categoriesAPI.create(form);
        if (res.success) {
          toast.success('Category created successfully');
          loadCategories();
          setOpenDialog(false);
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to save category';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (cat) => {
    setSelectedDeleteId(cat._id);
    setSelectedDeleteName(cat.name);
    setDeleteError('');
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await categoriesAPI.delete(selectedDeleteId);
      if (res.success) {
        toast.success('Category deleted successfully');
        loadCategories();
        setOpenDeleteDialog(false);
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Category Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Organize and classify your inventory products.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCategories}
            disabled={loading}
          >
            Refresh
          </Button>
          {canModify && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Category
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Search bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search categories by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Category cards grid */}
      <Grid container spacing={3}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="rounded" width={56} height={56} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="80%" />
                      <Skeleton width="40%" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : categories.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'action.hover' }}>
              <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                {search ? 'No categories match your search.' : 'No categories yet.'}
              </Typography>
              {!search && canModify && (
                <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={handleOpenAdd}>
                  Create First Category
                </Button>
              )}
            </Paper>
          </Grid>
        ) : (
          categories.map((cat) => (
            <Grid item xs={12} sm={6} md={4} key={cat._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar
                    src={cat.image}
                    variant="rounded"
                    sx={{ width: 56, height: 56, bgcolor: cat.color || 'primary.light', borderRadius: 2, flexShrink: 0 }}
                  >
                    <CategoryIcon sx={{ fontSize: 32, color: '#fff' }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }} noWrap>
                      {cat.name || 'Untitled'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1,
                      }}
                    >
                      {cat.description || 'No description provided.'}
                    </Typography>
                    <Chip
                      icon={<InventoryIcon />}
                      label={`${cat.productCount ?? 0} products`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                </CardContent>

                <CardActions
                  sx={{
                    justifyContent: 'flex-end',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    px: 2,
                    py: 1,
                  }}
                >
                  <Tooltip title="View Details">
                    <IconButton size="small" color="info" onClick={() => handleOpenView(cat)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canModify && (
                    <>
                      <Tooltip title="Edit Category">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cat)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Category">
                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(cat)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      {!loading && total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[6, 12, 24, 48]}
          sx={{ mt: 2 }}
        />
      )}

      {/* Add / Edit dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCategory ? 'Edit Category' : 'Create Category'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              fullWidth required
              label="Category Name"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setFormError('');
              }}
              error={!form.name && formError !== ''}
              helperText={!form.name && formError ? 'Required' : ''}
              autoFocus
            />
            <TextField
              fullWidth multiline rows={3}
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Category Color</Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      component="input"
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                      sx={{ width: 48, height: 36, border: 'none', p: 0, cursor: 'pointer', borderRadius: 1 }}
                    />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{form.color}</Typography>
                    <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: form.color }}>
                      <CategoryIcon sx={{ fontSize: 20, color: '#fff' }} />
                    </Avatar>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small"
                  label="Icon Name (Material Icons)"
                  value={form.icon}
                  onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                  helperText="e.g. devices, work, build, chair"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" type="number"
                  label="Sort Order"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                  helperText="Lower = shown first"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small"
                  label="Image URL (optional)"
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.png"
                  helperText="Optional product image URL"
                />
              </Grid>
            </Grid>
            {form.image && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="textSecondary">Image Preview:</Typography>
                <Avatar src={form.image} variant="rounded" sx={{ width: 48, height: 48, bgcolor: form.color }}>
                  <CategoryIcon />
                </Avatar>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Category Details</DialogTitle>
        <DialogContent dividers>
          {viewCategory && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={viewCategory.image}
                  variant="rounded"
                  sx={{ width: 72, height: 72, bgcolor: viewCategory.color || 'primary.light', borderRadius: 2 }}
                >
                  <CategoryIcon sx={{ fontSize: 40, color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{viewCategory.name}</Typography>
                  <Chip
                    icon={<InventoryIcon />}
                    label={`${viewCategory.productCount ?? 0} product(s) assigned`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Stack>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">DESCRIPTION</Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {viewCategory.description || 'No description provided.'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">CREATED</Typography>
                <Typography variant="body2">
                  {viewCategory.createdAt ? new Date(viewCategory.createdAt).toLocaleString() : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">LAST UPDATED</Typography>
                <Typography variant="body2">
                  {viewCategory.updatedAt ? new Date(viewCategory.updatedAt).toLocaleString() : '—'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={openDeleteDialog} onClose={() => !deleting && setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Category?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
            <Typography variant="body1">
              Are you sure you want to delete <strong>"{selectedDeleteName}"</strong>?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This category will be removed. If any products are assigned to it, deletion will be blocked to preserve data integrity.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
