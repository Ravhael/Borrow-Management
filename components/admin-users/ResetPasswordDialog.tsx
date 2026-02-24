import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, FormControlLabel, Checkbox, IconButton, InputAdornment } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'

interface Props {
  open: boolean
  user: { id: string; name?: string; email?: string } | null
  onClose: () => void
  onConfirm: (password: string, sendEmail: boolean) => Promise<void>
  initialSuggested?: string
}

const generatePassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-='
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

const ResetPasswordDialog: React.FC<Props> = ({ open, user, onClose, onConfirm, initialSuggested }) => {
  const [password, setPassword] = React.useState<string>(initialSuggested ?? generatePassword())
  const [sendEmail, setSendEmail] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [showCopied, setShowCopied] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setPassword(initialSuggested ?? generatePassword())
      setSendEmail(true)
      setShowCopied(false)
    }
  }, [open, initialSuggested])

  const handleConfirm = async () => {
    if (!user) return
    setLoading(true)
    try {
      await onConfirm(password, sendEmail)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 1500)
    } catch (err) {
      // ignore
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset Password {user ? `— ${user.name || user.email}` : ''}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            You can either use the suggested strong password below or enter a custom password. Choose whether to send the new password to the user by email.
          </Typography>

          <TextField
            label="Suggested / New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setPassword(generatePassword())} title="Regenerate suggested password">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={copyToClipboard} title={showCopied ? 'Copied' : 'Copy to clipboard'}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <FormControlLabel
            control={<Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />}
            label="Send the new password to the user via email"
          />

          <Box>
            <Typography variant="caption" color="text.secondary">Password strength: <strong>{password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Medium' : 'Weak'}</strong></Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ResetPasswordDialog
