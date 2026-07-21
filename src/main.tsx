import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from './pages/AppLayout';
import { LoginPage, RegisterPage } from './pages/AuthPages';
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
import { PwaStatus } from './components/PwaStatus';
import './styles/index.css';

const router = createBrowserRouter([
	{ path: '/login', element: <LoginPage /> },
	{ path: '/register', element: <RegisterPage /> },
	{ path: '/view', element: <PublicLeagueViewPage /> },
	{ path: '/view/:joinCode', element: <PublicLeagueViewPage /> },
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{ index: true, element: <Navigate to="/leagues" replace /> },
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

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
		<PwaStatus />
	</React.StrictMode>
);
