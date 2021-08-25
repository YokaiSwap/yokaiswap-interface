import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import { Credentials, StringTranslations } from '@crowdin/crowdin-api-client'
import { FaucetButton } from 'components/FaucetButton'
import { CheckPendingLayer1Txns } from 'components/CheckPendingLayer1Txns'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { RedirectDuplicateTokenIds, RedirectOldAddLiquidityPathStructure } from './AddLiquidity/redirects'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import AddLiquidity from './AddLiquidity'
import AddStablePoolLiquidity from './AddStablePoolLiquidity'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import Swap from './Swap'
import { RedirectPathToSwapOnly } from './Swap/redirects'
import { EN, allLanguages } from '../constants/localisation/languageCodes'
import { LanguageContext } from '../hooks/LanguageContext'
import { TranslationsContext } from '../hooks/TranslationsContext'

import Menu from '../components/Menu'
import RemoveStablePoolLiquidity from './RemoveStablePoolLiquidity'
import { RedirectPathToDeposit } from './Bridge/redirects'
import Deposit from './Bridge/deposit'
import Withdrawal from './Bridge/withdrawal'
import RequestWithdrawal from './Bridge/requestWithdrawal'
import UnlockWithdrawal from './Bridge/unlockWithdrawal'
import Transfer from './Bridge/transfer'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<any>(undefined)
  const [translatedLanguage, setTranslatedLanguage] = useState<any>(undefined)
  const [translations, setTranslations] = useState<Array<any>>([])
  const apiKey = `${process.env.REACT_APP_CROWDIN_APIKEY}`
  const projectId = parseInt(`${process.env.REACT_APP_CROWDIN_PROJECTID}`)
  const fileId = 6

  const credentials: Credentials = {
    token: apiKey,
  }

  const stringTranslationsApi = new StringTranslations(credentials)

  const getStoredLang = (storedLangCode: string) => {
    return allLanguages.filter((language) => {
      return language.code === storedLangCode
    })[0]
  }

  useEffect(() => {
    const storedLangCode = localStorage.getItem('pancakeSwapLanguage')
    if (storedLangCode) {
      const storedLang = getStoredLang(storedLangCode)
      setSelectedLanguage(storedLang)
    } else {
      setSelectedLanguage(EN)
    }
  }, [])

  const fetchTranslationsForSelectedLanguage = async () => {
    stringTranslationsApi
      .listLanguageTranslations(projectId, selectedLanguage.code, undefined, fileId, 200)
      .then((translationApiResponse) => {
        if (translationApiResponse.data.length < 1) {
          setTranslations(['error'])
        } else {
          setTranslations(translationApiResponse.data)
        }
      })
      .then(() => setTranslatedLanguage(selectedLanguage))
      .catch((error) => {
        setTranslations(['error'])
        console.error(error)
      })
  }

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslationsForSelectedLanguage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  return (
    <Suspense fallback={null}>
      <BrowserRouter>
        <LanguageContext.Provider
          value={{ selectedLanguage, setSelectedLanguage, translatedLanguage, setTranslatedLanguage }}
        >
          <TranslationsContext.Provider value={{ translations, setTranslations }}>
            <>
              <AppWrapper>
                <Menu>
                  <Popups />
                  <CheckPendingLayer1Txns />
                  <Web3ReactManager>
                    <Switch>
                      <Route exact strict path="/swap" component={Swap} />
                      <Route exact strict path="/liquidity/find" component={PoolFinder} />
                      <Route exact strict path="/liquidity" component={Pool} />
                      <Route exact path="/liquidity" component={AddLiquidity} />

                      <Route exact path="/liquidity/add/stable-pool/:poolAddress" component={AddStablePoolLiquidity} />
                      <Route
                        exact
                        path="/liquidity/remove/stable-pool/:poolAddress"
                        component={RemoveStablePoolLiquidity}
                      />

                      <Route
                        exact
                        strict
                        path="/liquidity/remove/:currencyIdA/:currencyIdB"
                        component={RemoveLiquidity}
                      />

                      {/* Redirection: These old routes are still used in the code base */}
                      <Route
                        exact
                        path="/liquidity/add/:currencyIdA"
                        component={RedirectOldAddLiquidityPathStructure}
                      />
                      <Route
                        exact
                        path="/liquidity/add/:currencyIdA/:currencyIdB"
                        component={RedirectDuplicateTokenIds}
                      />
                      <Route
                        exact
                        strict
                        path="/liquidity/remove/:tokens"
                        component={RedirectOldRemoveLiquidityPathStructure}
                      />

                      <Route exact path="/bridge/deposit" component={Deposit} />
                      <Route exact path="/bridge/withdrawal" component={Withdrawal} />
                      <Route exact path="/bridge/withdrawal/request" component={RequestWithdrawal} />
                      <Route exact path="/bridge/withdrawal/:withdrawalRequestOutPoint" component={UnlockWithdrawal} />
                      <Route exact path="/bridge/transfer" component={Transfer} />
                      <Route exact strict path="/bridge" component={RedirectPathToDeposit} />

                      <Route component={RedirectPathToSwapOnly} />
                    </Switch>
                  </Web3ReactManager>
                </Menu>
                <FaucetButton />
              </AppWrapper>
            </>
          </TranslationsContext.Provider>
        </LanguageContext.Provider>
      </BrowserRouter>
    </Suspense>
  )
}
