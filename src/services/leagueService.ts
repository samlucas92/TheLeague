import { apiRequest, postJson } from './api';
import type { Challenge, JoinPreview, League, LeagueSummary, LeaderboardRow, ManualPointsResult, Member, PointsFeedItem, PublicLeagueView, Submission } from './types';

export const leagueService = {
	list: () => apiRequest<LeagueSummary[]>('/leagues'),
	publicView: (joinCode: string) => apiRequest<PublicLeagueView>(`/public/leagues/${joinCode}`),
	create: (input: { name: string; description?: string; presetType: string; joinMode: string }) =>
		postJson<League>('/leagues', input),
	get: (leagueId: string) => apiRequest<League>(`/leagues/${leagueId}`),
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
	leaderboard: (leagueId: string) => apiRequest<LeaderboardRow[]>(`/leagues/${leagueId}/leaderboard`),
	pointsFeed: (leagueId: string) => apiRequest<PointsFeedItem[]>(`/leagues/${leagueId}/points-feed`)
};
