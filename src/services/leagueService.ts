import { apiRequest, postJson } from './api';
import type { Challenge, JoinPreview, League, LeagueAuditItem, LeagueSummary, LeaderboardRow, ManualPointsResult, Member, PointsFeedItem, PublicLeagueView, Submission, Tournament } from './types';

export const leagueService = {
	list: () => apiRequest<LeagueSummary[]>('/leagues'),
	publicView: (joinCode: string) => apiRequest<PublicLeagueView>(`/public/leagues/${joinCode}`),
	create: (input: { name: string; description?: string; presetType: string; joinMode: string }) =>
		postJson<League>('/leagues', input),
	get: (leagueId: string) => apiRequest<League>(`/leagues/${leagueId}`),
	updateSettings: (leagueId: string, input: { name: string; description?: string; joinMode: string; publicViewEnabled: boolean }) =>
		apiRequest<League>(`/leagues/${leagueId}`, {
			method: 'PUT',
			body: JSON.stringify(input)
		}),
	regenerateJoinCode: (leagueId: string) =>
		postJson<League>(`/leagues/${leagueId}/join-code/regenerate`),
	previewJoin: (joinCode: string) => postJson<JoinPreview>('/leagues/join-preview', { joinCode }),
	join: (joinCode: string, displayName: string) => postJson<Member>('/leagues/join', { joinCode, displayName }),
	members: (leagueId: string) => apiRequest<Member[]>(`/leagues/${leagueId}/members`),
	addOfflineMember: (leagueId: string, input: { displayName: string; emailAddress?: string; role: string }) =>
		postJson<Member>(`/leagues/${leagueId}/members/offline`, input),
	updateMember: (leagueId: string, memberId: string, input: { displayName: string; emailAddress?: string; role: string }) =>
		apiRequest<Member>(`/leagues/${leagueId}/members/${memberId}`, {
			method: 'PUT',
			body: JSON.stringify(input)
		}),
	changeMemberRole: (leagueId: string, memberId: string, role: string) =>
		apiRequest<Member>(`/leagues/${leagueId}/members/${memberId}/role`, {
			method: 'PUT',
			body: JSON.stringify({ role })
		}),
	removeMember: (leagueId: string, memberId: string) =>
		apiRequest<void>(`/leagues/${leagueId}/members/${memberId}`, { method: 'DELETE' }),
	linkOfflineMember: (leagueId: string, memberId: string, emailAddress: string) =>
		postJson<Member>(`/leagues/${leagueId}/members/${memberId}/link`, { emailAddress }),
	challenges: (leagueId: string) => apiRequest<Challenge[]>(`/leagues/${leagueId}/challenges`),
	createChallenge: (leagueId: string, input: { name: string; description?: string; targetMemberIds: string[]; pointsForSuccess: number; pointsForFailure: number }) =>
		postJson<Challenge>(`/leagues/${leagueId}/challenges`, input),
	updateChallenge: (leagueId: string, challengeId: string, input: { name: string; description?: string; targetMemberIds: string[]; pointsForSuccess: number; pointsForFailure: number; isActive: boolean }) =>
		apiRequest<Challenge>(`/leagues/${leagueId}/challenges/${challengeId}`, {
			method: 'PUT',
			body: JSON.stringify(input)
		}),
	deleteChallenge: (leagueId: string, challengeId: string) =>
		apiRequest<void>(`/leagues/${leagueId}/challenges/${challengeId}`, { method: 'DELETE' }),
	acceptChallenge: (leagueId: string, challengeId: string) =>
		postJson<Challenge>(`/leagues/${leagueId}/challenges/${challengeId}/accept`),
	rejectChallenge: (leagueId: string, challengeId: string) =>
		postJson(`/leagues/${leagueId}/challenges/${challengeId}/reject`),
	completeChallenge: (leagueId: string, challengeId: string, targetMemberId?: string) =>
		postJson(`/leagues/${leagueId}/challenges/${challengeId}/complete`, { targetMemberId }),
	failChallenge: (leagueId: string, challengeId: string, targetMemberId?: string) =>
		postJson(`/leagues/${leagueId}/challenges/${challengeId}/fail`, { targetMemberId }),
	tournaments: (leagueId: string) => apiRequest<Tournament[]>(`/leagues/${leagueId}/tournaments`),
	createTournament: (leagueId: string, input: { name: string; gameType: string; format?: string; structure?: string; matchRule?: string; framesOrLegs?: number; poolRules?: string[]; breakRule?: string; callShotRequired?: boolean; allowRerack?: boolean; pushOutAfterFouls?: boolean; doubleInRequired?: boolean; doubleOutRequired?: boolean; startScore?: number | null; minimumPlayers?: number; roundTimeLimitMinutes?: number | null; participantMemberIds: string[]; winnerPoints: number; runnerUpPoints: number; matchWinPoints: number; eliminatePerRound: number; challengeId?: string | null }) =>
		postJson<Tournament>(`/leagues/${leagueId}/tournaments`, input),
	completeTournamentMatch: (leagueId: string, tournamentId: string, matchId: string, input: { winnerMemberId: string; playerOneScore?: number | null; playerTwoScore?: number | null }) =>
		postJson<Tournament>(`/leagues/${leagueId}/tournaments/${tournamentId}/matches/${matchId}/complete`, input),
	scoreTournamentRound: (leagueId: string, tournamentId: string, scores: Record<string, number>) =>
		postJson<Tournament>(`/leagues/${leagueId}/tournaments/${tournamentId}/rounds/score`, { scores }),
	deleteTournament: (leagueId: string, tournamentId: string) =>
		apiRequest<void>(`/leagues/${leagueId}/tournaments/${tournamentId}`, { method: 'DELETE' }),
	submit: (leagueId: string, input: { challengeId: string; requestedPoints?: number | null; publicReason: string }) =>
		postJson<Submission>(`/leagues/${leagueId}/submissions`, input),
	mySubmissions: (leagueId: string) => apiRequest<Submission[]>(`/leagues/${leagueId}/submissions/mine`),
	pendingSubmissions: (leagueId: string) => apiRequest<Submission[]>(`/leagues/${leagueId}/submissions/pending`),
	approveSubmission: (leagueId: string, submissionId: string, input: { approvedPoints?: number | null; publicReviewReason: string }) =>
		postJson(`/leagues/${leagueId}/submissions/${submissionId}/approve`, input),
	rejectSubmission: (leagueId: string, submissionId: string, input: { publicReviewReason: string }) =>
		postJson(`/leagues/${leagueId}/submissions/${submissionId}/reject`, input),
	addPoints: (leagueId: string, input: { leagueMemberId: string; points: number; reason: string }) =>
		postJson<ManualPointsResult>(`/leagues/${leagueId}/allocations`, input),
	updatePoints: (leagueId: string, allocationId: string, input: { leagueMemberId: string; points: number; reason: string }) =>
		apiRequest<PointsFeedItem>(`/leagues/${leagueId}/allocations/${allocationId}`, {
			method: 'PUT',
			body: JSON.stringify(input)
		}),
	deletePoints: (leagueId: string, allocationId: string) =>
		apiRequest<void>(`/leagues/${leagueId}/allocations/${allocationId}`, { method: 'DELETE' }),
	audit: (leagueId: string) => apiRequest<LeagueAuditItem[]>(`/leagues/${leagueId}/audit`),
	leaderboard: (leagueId: string) => apiRequest<LeaderboardRow[]>(`/leagues/${leagueId}/leaderboard`),
	pointsFeed: (leagueId: string) => apiRequest<PointsFeedItem[]>(`/leagues/${leagueId}/points-feed`)
};
