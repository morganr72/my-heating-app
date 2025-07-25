import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { withAuthenticator, Heading } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

import Layout from './components/Layout';

// --- AWS AMPLIFY CONFIGURATION ---
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-2_SpWEM2H2M', 
      userPoolClientId: '7kde18g8ga9gr9hpck0llqfrll',
    }
  }
});

// --- LAZY-LOADED PAGES ---
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfileSettingsPage = React.lazy(() => import('./pages/ProfileSettingsPage'));
const UserSignUp = React.lazy(() => import('./pages/UserSignUp'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const PaymentSetupPage = React.lazy(() => import('./pages/PaymentSetupPage'));


function App() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profiles" element={<ProfileSettingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="signup" element={<UserSignUp />} />
          <Route path="payment-setup" element={<PaymentSetupPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default withAuthenticator(App, {
    components: {
        Header() {
            return <Heading level={3} padding="1rem 0" textAlign="center">Bountifuel Control</Heading>;
        }
    }
});
