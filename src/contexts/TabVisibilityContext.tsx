import React, { useContext, useEffect, useState } from 'react'

const TabVisibilityContext = React.createContext(true)

export function TabVisibilityProvider({ children }: React.PropsWithChildren<unknown>) {
  const [isTabVisible, setIsTabVisible] = useState(true)

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    window.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return <TabVisibilityContext.Provider value={isTabVisible}>{children}</TabVisibilityContext.Provider>
}

export function useIsTabVisible() {
  return useContext(TabVisibilityContext)
}
