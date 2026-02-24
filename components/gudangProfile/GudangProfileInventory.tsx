import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { GudangInventoryItem } from '../../types/gudangProfile';

interface GudangProfileInventoryProps {
  inventory: GudangInventoryItem[];
}

const GudangProfileInventory: React.FC<GudangProfileInventoryProps> = ({ inventory }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" component="h2" fontWeight={600}>
            Inventory Overview
          </Typography>
        </Box>

        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Category ID</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Items Count</strong></TableCell>
                <TableCell align="right"><strong>Total Value</strong></TableCell>
                <TableCell><strong>Last Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">{item.itemsCount}</TableCell>
                  <TableCell align="right">{formatCurrency(item.totalValue)}</TableCell>
                  <TableCell>{new Date(item.lastUpdated).toLocaleDateString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default GudangProfileInventory;