import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AccountPage } from './pages/AccountPage';
import { AppLayout } from './pages/AppLayout';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages';
import { CreateLeaguePage, JoinLeaguePage } from './pages/CreateJoinPages';
import { LeagueListPage } from './pages/LeagueListPage';
import {
	AdminPage,
	ChallengesPage,
	LeaderboardPage,
	LeagueWorkspace,
	MembersPage,
	MySubmissionsPage,
	OverviewPage,
	PointsFeedPage
} from './pages/LeagueWorkspace';
import { PublicLeagueViewPage } from './pages/PublicLeagueViewPage';
import { AppErrorPage } from './components/AppErrorPage';
import { PwaStatus } from './components/PwaStatus';
import { WarmUpSplash } from './components/WarmUpSplash';
import { useAuthStore } from './store/authStore';
import './styles/index.css';

const router = createBrowserRouter([
	{ path: '/login', element: <LoginPage />, errorElement: <AppErrorPage /> },
	{ path: '/register', element: <RegisterPage />, errorElement: <AppErrorPage /> },
	{ path: '/forgot-password', element: <ForgotPasswordPage />, errorElement: <AppErrorPage /> },
	{ path: '/reset-password', element: <ResetPasswordPage />, errorElement: <AppErrorPage /> },
	{ path: '/view', element: <PublicLeagueViewPage />, errorElement: <AppErrorPage /> },
	{ path: '/view/:joinCode', element: <PublicLeagueViewPage />, errorElement: <AppErrorPage /> },
	{
		path: '/',
		element: <AppLayout />,
		errorElement: <AppErrorPage />,
		children: [
			{ index: true, element: <Navigate to="/leagues" replace /> },
			{ path: 'account', element: <AccountPage /> },
			{ path: 'leagues', element: <LeagueListPage /> },
			{ path: 'leagues/create', element: <CreateLeaguePage /> },
			{ path: 'join', element: <JoinLeaguePage /> },
			{
				path: 'leagues/:leagueId',
				element: <LeagueWorkspace />,
				children: [
					{ index: true, element: <OverviewPage /> },
					{ path: 'leaderboard', element: <LeaderboardPage /> },
					{ path: 'points', element: <PointsFeedPage /> },
					{ path: 'challenges', element: <ChallengesPage /> },
					{ path: 'submissions', element: <MySubmissionsPage /> },
					{ path: 'members', element: <MembersPage /> },
					{ path: 'admin', element: <AdminPage /> }
				]
			}
		]
	}
]);

function Root() {
	const [isReady, setIsReady] = React.useState(false);
	const loadMe = useAuthStore((state) => state.loadMe);
	const prepareApp = React.useCallback(() => loadMe(), [loadMe]);

	if (!isReady) {
		return <WarmUpSplash prepareApp={prepareApp} onReady={() => setIsReady(true)} />;
	}

	return (
		<>
			<RouterProvider router={router} />
			<PwaStatus />
		</>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<Root />
	</React.StrictMode>
);
