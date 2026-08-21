import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, IconButton, colors } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link as RouterLink } from 'react-router-dom';

export default function ProductTable({ products, onDelete }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Item Number</TableCell>
          <TableCell>Price ($)</TableCell>
          <TableCell>Quantity</TableCell>
          <TableCell>Total Value ($)</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p._id}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.item_number}</TableCell>
            <TableCell>{typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</TableCell>
            <TableCell>{p.quantity}</TableCell>
            <TableCell>
              {typeof p.price === 'number' && typeof p.quantity === 'number' 
                ? (p.price * p.quantity).toFixed(2) 
                : 'N/A'}
            </TableCell>
            <TableCell align="right">
              <IconButton component={RouterLink} to={`/edit/${p._id}`} size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => onDelete(p._id)} size="small">
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
