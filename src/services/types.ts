export type User = {
	id: string;
	name: string;
	emailAddress: string;
	isEmailVerified: boolean;
	isSiteAdmin: boolean;
};

export type LoginResponse = {
	token: string;
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
	publicViewEnabled: boolean;
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
	createdByUserId: string;
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
	outcomes: ChallengeOutcome[];
};

export type ChallengeOutcome = {
	leagueMemberId: string;
	displayName: string;
	status: string;
	awardedAt?: string | null;
	awardedByName?: string | null;
	points?: number | null;
};

export type Submission = {
	id: string;
	challengeId?: string | null;
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

export type ManualPointsResult = {
	status: string;
	allocation?: PointsFeedItem | null;
	submission?: Submission | null;
};

export type PublicLeagueView = {
	league: League;
	members: Member[];
	leaderboard: LeaderboardRow[];
	pointsFeed: PointsFeedItem[];
	challenges: Challenge[];
};

export type LeagueAuditItem = {
	id: string;
	action: string;
	performedByUserId: string;
	performedByName: string;
	entityType: string;
	entityId?: string | null;
	summary: string;
	createdAt: string;
};

export type EmailAuditItem = {
	id: string;
	provider: string;
	status: string;
	toEmailAddress: string;
	toName?: string | null;
	subject: string;
	attempts: number;
	providerMessageId?: string | null;
	failureReason?: string | null;
	createdAt: string;
	updatedAt: string;
	sentAt?: string | null;
	nextAttemptAt?: string | null;
};

export type SiteUserAdminItem = {
	id: string;
	name: string;
	emailAddress: string;
	isEmailVerified: boolean;
	isSiteAdmin: boolean;
	isDeleted: boolean;
	createdAt: string;
	emailVerifiedAt?: string | null;
	deletedAt?: string | null;
};
