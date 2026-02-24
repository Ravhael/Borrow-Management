import React from 'react'
import {
	Alert,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Box,
	FormControlLabel,
	Paper,
	Switch,
	Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { entitasOptions } from '../../data/entitas'

function getEntitasName(entitasId: string) {
	const id = parseInt(entitasId, 10)
	return entitasOptions.find((e) => e.id === id)?.label || entitasId
}

interface RecipientEntry {
	role: string
	email: string
}

interface ApprovalInfo {
	approverName?: string
	approvedAt?: string
	note?: string
}

interface OnSubmitTabProps {
	raw: any
	noLoansFound: boolean
	isUpdate: boolean
	setIsUpdate: (value: boolean) => void
	forceNewSubmission: boolean
	setForceNewSubmission: (value: boolean) => void
	entitasRecipients: RecipientEntry[]
	entitasHtml: string
	userHtml: string
	approverHtml: string
	borrowerHtml: string
	borrowerEmail: string
	entitasApproval?: ApprovalInfo
	marketingApproval?: ApprovalInfo
	formatExtendTimestamp: (value?: string, dateOnly?: boolean) => string
}

function HtmlPreview({ title, html }: { title: string; html: string }) {
	return (
		<Paper sx={{ p: 3 }}>
			<Typography variant="h6" gutterBottom>
				{title}
			</Typography>
			<Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
				<div dangerouslySetInnerHTML={{ __html: html }} />
			</Box>
			<Accordion>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography>Raw HTML</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Box
						component="pre"
						sx={{
							whiteSpace: 'pre-wrap',
							maxHeight: 300,
							overflow: 'auto',
							fontSize: '0.875rem',
							bgcolor: 'grey.100',
							p: 2,
							borderRadius: 1,
						}}
					>
						{html}
					</Box>
				</AccordionDetails>
			</Accordion>
		</Paper>
	)
}

export default function OnSubmitTab(props: OnSubmitTabProps) {
	const {
		raw,
		noLoansFound,
		isUpdate,
		setIsUpdate,
		forceNewSubmission,
		setForceNewSubmission,
		entitasRecipients,
		entitasHtml,
		userHtml,
		approverHtml,
		borrowerHtml,
		borrowerEmail,
		entitasApproval,
		marketingApproval,
		formatExtendTimestamp,
	} = props

	return (
		<>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
				{noLoansFound && (
					<Alert severity="warning" sx={{ borderRadius: 1 }}>
						Tidak ada data peminjaman yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.
					</Alert>
				)}
				<Paper sx={{ p: 3 }}>
					<Typography variant="h6" gutterBottom>
						Entitas Email
					</Typography>
					{entitasRecipients.length === 0 ? (
						<Alert severity="warning" sx={{ borderRadius: 1, mb: 2 }}>
							No Entitas recipients configured for this loan — entitasId: {String(raw?.entitasId || '-')}
						</Alert>
					) : (
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
								Recipients for {getEntitasName(String(raw?.entitasId || '-'))}:
							</Typography>
							<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
								{entitasRecipients.map((recipient) => (
									<Typography
										key={`${recipient.role}:${recipient.email || ''}`}
										sx={{ fontSize: '0.875rem', bgcolor: 'grey.100', p: '6px 8px', borderRadius: 1 }}
									>
										<strong>{recipient.role}</strong>: {recipient.email}
									</Typography>
								))}
							</Box>
						</Box>
					)}
					<Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
						<div dangerouslySetInnerHTML={{ __html: entitasHtml }} />
					</Box>
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography>Raw HTML</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Box
								component="pre"
								sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}
							>
								{entitasHtml}
							</Box>
						</AccordionDetails>
					</Accordion>
				</Paper>

				<HtmlPreview title="Marketing Email" html={userHtml} />

				<Paper sx={{ p: 3 }}>
					<Typography variant="h6" gutterBottom>
						Borrower Email
					</Typography>
					{!borrowerEmail ? (
						<Alert severity="warning" sx={{ borderRadius: 1, mb: 2 }}>
							No Borrower recipient configured for this loan — borrowerEmail: {String(raw?.borrowerEmail || '-')}
						</Alert>
					) : (
						<Box sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
								Recipient:
							</Typography>
							<Typography sx={{ fontSize: '0.875rem', bgcolor: 'grey.100', p: '6px 8px', borderRadius: 1 }}>{borrowerEmail}</Typography>
						</Box>
					)}
					<Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
						<div dangerouslySetInnerHTML={{ __html: borrowerHtml }} />
					</Box>
					<Accordion>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography>Raw HTML</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Box
								component="pre"
								sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}
							>
								{borrowerHtml}
							</Box>
						</AccordionDetails>
					</Accordion>
				</Paper>

			<HtmlPreview title="Admin Email" html={approverHtml} />
		</Box>

			<Box sx={{ mb: 3 }}>
				<FormControlLabel
					control={
						<Switch
							checked={isUpdate}
							onChange={(event) => setIsUpdate(event.target.checked)}
							color="primary"
						/>
					}
					label="isUpdate (show update banner)"
				/>
				<FormControlLabel
					control={
						<Switch
							checked={forceNewSubmission}
							onChange={(event) => setForceNewSubmission(event.target.checked)}
							color="primary"
						/>
					}
					label="Force new submission variant (ignore DB approval state)"
				/>
				<Box sx={{ mt: 1 }}>
					{raw?.loanStatus && (
						<Typography variant="body2" sx={{ color: 'text.secondary' }}>
							Loan status: <strong>{String(raw.loanStatus)}</strong>
						</Typography>
					)}
					{entitasApproval?.approverName && (
						<Typography variant="body2" sx={{ color: 'text.secondary' }}>
							Entitas approval: <strong>{entitasApproval.approverName}</strong>
							{entitasApproval.approvedAt ? `, ${formatExtendTimestamp(entitasApproval.approvedAt)}` : ''}
						</Typography>
					)}
					{marketingApproval?.approverName && (
						<Typography variant="body2" sx={{ color: 'text.secondary' }}>
							Marketing approval: <strong>{marketingApproval.approverName}</strong>
							{marketingApproval.approvedAt ? `, ${formatExtendTimestamp(marketingApproval.approvedAt)}` : ''}
						</Typography>
					)}
				</Box>
			</Box>
		</>
	)
}
