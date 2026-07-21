export type User = {
	id: string;
	name: string;
	emailAddress: string;
};

export type LoginResponse = {
	token: string;
	accessToken?: string;
	expiresAt: string;
	user: User;
};

export type LeagueSummary = {
	id: string;
	name: string;
	description?: string | null;
	status: string;
	role: string;
	membershipStatus: string;
	joinCode: string;
};

export type League = {
	id: string;
	name: string;
	description?: string | null;
	joinCode: string;
	status: string;
	joinMode: string;
	presetType: string;
	showPendingPointsOnLeaderboard: boolean;
};

export type JoinPreview = {
	leagueId: string;
	name: string;
	description?: string | null;
	ownerName: string;
	joinMode: string;
	requiresApproval: boolean;
};

export type Member = {
	id: string;
	leagueId: string;
	userId?: string | null;
	displayName: string;
	emailAddress?: string | null;
	isOfflineMember: boolean;
	role: string;
	status: string;
};

export type Challenge = {
	id: string;
	name: string;
	description?: string | null;
	targetMemberIds: string[];
	targetNames: string[];
	acceptedMemberIds: string[];
	rejectedMemberIds: string[];
	completedMemberIds: string[];
	failedMemberIds: string[];
	pointsForSuccess: number;
	pointsForFailure: number;
	isActive: boolean;
	createdAt: string;
};

export type Submission = {
	id: string;
	challengeId: string;
	challengeName: string;
	leagueMemberId: string;
	displayName: string;
	requestedPoints?: number | null;
	approvedPoints?: number | null;
	publicReason: string;
	status: string;
	submittedAt: string;
	reviewedAt?: string | null;
};

export type LeaderboardRow = {
	position: number;
	leagueMemberId: string;
	displayName: string;
	approvedPoints: number;
	pendingPoints: number;
};

export type PointsFeedItem = {
	allocationId: string;
	leagueMemberId: string;
	displayName: string;
	points: number;
	reason: string;
	source: string;
	challengeName?: string | null;
	awardedByName: string;
	awardedAt: string;
};

export type PublicLeagueView = {
	league: League;
	members: Member[];
	leaderboard: LeaderboardRow[];
	pointsFeed: PointsFeedItem[];
	challenges: Challenge[];
};
