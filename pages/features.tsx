import React from 'react'
import Head from 'next/head'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'
import Footer from '../components/Footer'
import { NavigationHeader, HeroSection, CoreFeaturesSection, AdditionalFeaturesSection, CTASection } from '../components/features'
import { featuresTheme } from '../themes/featuresTheme'

export default function Features() {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('sm'))

  return (
    <ThemeProvider theme={featuresTheme}>
      <div style={{ minHeight: '100vh', backgroundColor: featuresTheme.palette.background.default }}>
        <Head>
          <title>Features - FormFlow Corporate Loan Management</title>
          <meta name="description" content="Explore comprehensive features of FormFlow - enterprise-grade loan management system with advanced analytics, real-time processing, and seamless integration" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <NavigationHeader isMobile={isMobile} isSmallScreen={isSmallScreen} />
        <HeroSection />
        <CoreFeaturesSection />
        <AdditionalFeaturesSection />
        <CTASection />

        <Footer />
      </div>
    </ThemeProvider>
  )
}