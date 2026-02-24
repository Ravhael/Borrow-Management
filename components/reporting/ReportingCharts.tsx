import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type ReportingChartDatum = Record<string, string | number>

export interface ReportingChartsData {
  loansByMonth: Array<{ month: string; total: number }>
  loansByStatus: Array<{ status: string; value: number }>
  loansByNeedType: Array<{ needType: string; value: number }>
  loansByEntitas: Array<{ entitas: string; value: number }>
  topBorrowers: Array<{ name: string; value: number }>
  topEntitas: Array<{ name: string; value: number }>
  activeItems: Array<{
    item: string;
    value: number;
    topBorrower: string;
    topEntitas: string;
    borrowers: Array<{ borrower: string; entitas: string; count: number }>;
  }>
  overdueFines: Array<{
    borrower: string;
    entitas: string;
    totalFine: number;
    daysOverdue: number;
    loans: number;
  }>
}

export default function ReportingCharts({ data }: { data: ReportingChartsData }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const activeItems = data.activeItems || []
  const overdueFines = data.overdueFines || []
  const currencyFormatter = React.useMemo(() => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }), [])

  const pieColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
  ]

  const chartHeight = isMobile ? 260 : 320

  const ActiveItemsTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    const details = payload[0]?.payload
    if (!details) return null
    return (
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', boxShadow: theme.shadows[2], minWidth: 200 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {details.item}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Total Dipinjam: {details.value}
        </Typography>
        <Divider sx={{ my: 1 }} />
        {Array.isArray(details.borrowers) && details.borrowers.length > 0 ? (
          details.borrowers.slice(0, 3).map((entry: any, index: number) => (
            <Typography key={`${details.item}-borrower-${index}`} variant="caption" color="text.secondary" display="block">
              {entry.borrower} ({entry.entitas}) · {entry.count}x
            </Typography>
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            Tidak ada detail peminjam
          </Typography>
        )}
      </Box>
    )
  }

  const OverdueFineTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    const details = payload[0]?.payload
    if (!details) return null
    return (
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff', boxShadow: theme.shadows[2] }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {details.borrower}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Entitas: {details.entitas}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Overdue: {details.daysOverdue} hari · {details.loans} pinjaman
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Total Denda: {currencyFormatter.format(details.totalFine)}
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      {/* Row 1: Trend & Status */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Tren Pengajuan (per Bulan)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Berdasarkan tanggal submitted/created.
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: chartHeight, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={data.loansByMonth} 
                    margin={{ left: isMobile ? -10 : 0, right: 8, top: 16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: isMobile ? 10 : 12 }} 
                      interval={isMobile ? 1 : 0}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 50 : 30}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3], fontSize: 12 }}
                    />
                    {!isMobile && <Legend />}
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Loan"
                      stroke={theme.palette.primary.main}
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 4, strokeWidth: 2 }}
                      activeDot={{ r: isMobile ? 4 : 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Distribusi Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status saat ini (Lifecycle/Gudang).
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: chartHeight, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center" 
                      wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 8 }} 
                    />
                    <Pie
                      data={data.loansByStatus}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 100}
                      paddingAngle={2}
                    >
                      {data.loansByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Entitas Distribution Pie Chart */}
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Distribusi Entitas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Berdasarkan entitas peminjam.
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: chartHeight, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center" 
                      wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 8 }} 
                    />
                    <Pie
                      data={data.loansByEntitas}
                      dataKey="value"
                      nameKey="entitas"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 100}
                      paddingAngle={2}
                    >
                      {data.loansByEntitas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Active borrowed items */}
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Barang Masih Dipinjam
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Item aktif terbanyak serta peminjamnya.
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: chartHeight, mt: 1 }}>
                {activeItems.length === 0 ? (
                  <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Belum ada pinjaman aktif.
                    </Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeItems}
                      layout="vertical"
                      margin={{ left: isMobile ? 0 : 32, right: 12, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis
                        dataKey="item"
                        type="category"
                        width={isMobile ? 90 : 120}
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                      />
                      <Tooltip content={<ActiveItemsTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                      <Bar
                        dataKey="value"
                        name="Jumlah"
                        fill={theme.palette.primary.main}
                        radius={[0, 4, 4, 0]}
                        barSize={isMobile ? 16 : 20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Overdue fines chart */}
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Peminjam Terkena Denda
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Berdasarkan keterlambatan pengembalian.
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: chartHeight, mt: 1 }}>
                {overdueFines.length === 0 ? (
                  <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Tidak ada denda aktif.
                    </Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overdueFines}
                      layout="vertical"
                      margin={{ left: isMobile ? 0 : 32, right: 12, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                      <XAxis type="number" tickFormatter={(value) => currencyFormatter.format(value)} />
                      <YAxis
                        dataKey="borrower"
                        type="category"
                        width={isMobile ? 90 : 120}
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                      />
                      <Tooltip content={<OverdueFineTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                      <Bar
                        dataKey="totalFine"
                        name="Total Denda"
                        fill={theme.palette.error.main}
                        radius={[0, 4, 4, 0]}
                        barSize={isMobile ? 16 : 20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Row 2: Need Type & Top Borrowers */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Kategori Kebutuhan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Berdasarkan Need Type.
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: isMobile ? 220 : 300, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.loansByNeedType} 
                    layout="vertical" 
                    margin={{ left: isMobile ? 0 : 40, right: 16, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis 
                      dataKey="needType" 
                      type="category" 
                      width={isMobile ? 80 : 100} 
                      tick={{ fontSize: isMobile ? 9 : 11 }} 
                    />
                    <Tooltip cursor={{ fill: theme.palette.action.hover }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" name="Jumlah" fill={theme.palette.info.main} radius={[0, 4, 4, 0]} barSize={isMobile ? 16 : 20} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={1}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                Top 5 Peminjam Teraktif
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User dengan frekuensi peminjaman tertinggi.
              </Typography>
              <Divider />
              <Box sx={{ width: '100%', height: isMobile ? 220 : 300, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.topBorrowers} 
                    layout="vertical" 
                    margin={{ left: isMobile ? 0 : 40, right: 16, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={isMobile ? 80 : 100} 
                      tick={{ fontSize: isMobile ? 9 : 11 }} 
                    />
                    <Tooltip cursor={{ fill: theme.palette.action.hover }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" name="Jumlah Loan" fill={theme.palette.success.main} radius={[0, 4, 4, 0]} barSize={isMobile ? 16 : 20} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
