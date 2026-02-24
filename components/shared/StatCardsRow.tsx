import React from 'react'
import { Box } from '@mui/material'
import StatHighlightCard from './StatHighlightCard'

export type StatCard = {
  label: string
  caption: string
  value?: number | string
  icon?: React.ReactNode
  accent?: string
  delay?: number
  formatter?: (value: number) => string
}

export interface StatCardsRowProps {
  cards: StatCard[]
  maxColumns?: number // default 7
  gap?: number
}

const StatCardsRow: React.FC<StatCardsRowProps> = ({ cards, maxColumns = 7, gap = 2 }) => {
  const colCount = Math.max(1, Math.min(maxColumns, cards.length))
  const gridTemplateColumns = {
    xs: `repeat(${colCount}, minmax(90px, 1fr))`,
    sm: `repeat(${colCount}, minmax(100px, 1fr))`,
    md: `repeat(${colCount}, minmax(120px, 1fr))`,
    lg: `repeat(${colCount}, minmax(140px, 1fr))`
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns,
        gap,
        mt: 4,
        width: '100%'
      }}
    >
      {cards.map((card) => (
        <StatHighlightCard
          key={card.label}
          label={card.label}
          caption={card.caption}
          value={typeof card.value === 'number' ? card.value : Number(card.value ?? 0)}
          icon={card.icon}
          accentColor={card.accent}
          delay={card.delay}
          formatter={card.formatter}
        />
      ))}
    </Box>
  )
}

export default StatCardsRow
