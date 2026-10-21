import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { usePosthogAfterIdentify } from '../lib/PosthogIdentityContext'

const PAGE_NAMES = {
  '/': 'dashboard',
  '/bundles': 'bundle',
  '/credits': 'credits',
  '/faq': 'FAQ',
  '/preferences': 'preferences',
  '/entire-store': 'entire_store',
  '/product-page': 'product_page',
  '/brand-ads': 'brand_ads',
}

export function usePageTracking(pageNameOverride) {
  const location = useLocation()
  const posthog = usePosthogAfterIdentify()
  const enteredAtRef = useRef(Date.now())

  useEffect(() => {
    if (!posthog) return

    const page_name =
      pageNameOverride ||
      PAGE_NAMES[location.pathname] ||
      location.pathname
    enteredAtRef.current = Date.now()
    posthog.capture('page_viewed', {
      page_name,
      page_path: location.pathname,
    })

    return () => {
      const duration_seconds = Math.round(
        (Date.now() - enteredAtRef.current) / 1000,
      )
      if (duration_seconds < 1) return
      posthog.capture('page_left', {
        page_name,
        page_path: location.pathname,
        duration_seconds,
      })
    }
  }, [location.pathname, pageNameOverride, posthog])
}
