export interface BlogPost {
	slug: string
	title: string
	excerpt: string
	thumbnailUrl: string
	tags: string[]
	authorId: string
	authorName: string
	publishedAt: string
	readMinutes: number
	likes: number
}

export interface ProblemAnswer {
	id: string
	authorId: string
	authorName: string
	content: string
	createdAt: string
	votes: number
	isAccepted?: boolean
}

export interface ProblemPost {
	id: string
	title: string
	summary: string
	description: string
	tags: string[]
	ownerId: string
	ownerName: string
	createdAt: string
	votes: number
	views: number
	isResolved: boolean
	resolvedById?: string
	resolvedByName?: string
	answers: ProblemAnswer[]
}

export type NotificationType = 'system' | 'problem' | 'blog' | 'mention'

export interface NotificationItem {
	id: string
	type: NotificationType
	title: string
	message: string
	createdAt: string
	isRead: boolean
	actionUrl?: string
}

export const mockProfileId = '2b649ffd-82a1-4d19-95ec-a41878b0eaed'

export const blogPosts: BlogPost[] = [
	{
		slug: 'mysql-index-wars',
		title: 'Index Wars: Why Query #42 Was 80x Slower',
		excerpt:
			'A real production case where one missing composite index melted a dashboard and how we traced it back with EXPLAIN.',
		thumbnailUrl: 'https://picsum.photos/seed/mysql-index-wars/1200/700',
		tags: ['mysql', 'performance', 'indexing'],
		authorId: mockProfileId,
		authorName: 'Engineer HN',
		publishedAt: '2026-03-01',
		readMinutes: 8,
		likes: 91,
	},
	{
		slug: 'schema-migration-playbook',
		title: 'Schema Migration Playbook For Busy Teams',
		excerpt:
			'Rolling schema changes without downtime sounds hard. This write-up breaks down safe migration phases with rollback checkpoints.',
		thumbnailUrl:
			'https://picsum.photos/seed/schema-migration-playbook/1200/700',
		tags: ['database', 'migration', 'teamwork'],
		authorId: mockProfileId,
		authorName: 'Engineer HN',
		publishedAt: '2026-02-23',
		readMinutes: 11,
		likes: 134,
	},
	{
		slug: 'sql-debugging-mental-model',
		title: 'The SQL Debugging Mental Model I Use Daily',
		excerpt:
			'Three repeatable steps to debug unknown SQL behavior fast: isolate, measure, and narrow execution paths.',
		thumbnailUrl:
			'https://picsum.photos/seed/sql-debugging-mental-model/1200/700',
		tags: ['sql', 'debugging'],
		authorId: '2f38e01b-501f-45dc-b5e8-4595c0f1d142',
		authorName: 'Lan Data',
		publishedAt: '2026-02-19',
		readMinutes: 6,
		likes: 47,
	},
	{
		slug: 'postgres-plan-regressions',
		title: 'Postgres Plan Regressions After Minor Upgrade',
		excerpt:
			'Minor version bumps can still shift optimizer choices. Here are practical guardrails we apply before release windows.',
		thumbnailUrl:
			'https://picsum.photos/seed/postgres-plan-regressions/1200/700',
		tags: ['postgresql', 'query-plan', 'operations'],
		authorId: 'be6f7447-8f29-43aa-a16f-79c6905cae4e',
		authorName: 'Minh Ops',
		publishedAt: '2026-02-11',
		readMinutes: 9,
		likes: 63,
	},
]

export const blogDetails: Record<string, string[]> = {
	'mysql-index-wars': [
		'The incident started with a seemingly harmless reporting query that joined two medium-sized tables and filtered by a date range.',
		'The execution plan showed a full table scan because the filter columns were indexed separately but never together.',
		'After adding a composite index in the right order and validating cardinality, p95 dropped from 4.8s to 60ms.',
	],
	'schema-migration-playbook': [
		'We split migrations into additive changes, data backfill, application switch, and cleanup.',
		'Every phase had a rollback boundary and an explicit verification checklist so the on-call engineer could make decisions quickly.',
		'The key was consistency: every migration PR used the same template and smoke queries.',
	],
	'sql-debugging-mental-model': [
		'Start by freezing variables: one query, one dataset, one known output target.',
		'Then measure with EXPLAIN and timing against small and large samples before guessing.',
		'Finally narrow: eliminate clauses one by one until the behavior shift becomes obvious.',
	],
	'postgres-plan-regressions': [
		'Even minor upgrades may alter planner defaults and row-estimation strategies.',
		'Our guardrails include plan snapshotting, top query replay in staging, and threshold alerts for changed cost profiles.',
		'The fastest wins came from extended statistics and refreshed histograms in skewed tables.',
	],
}

export const problemPosts: ProblemPost[] = [
	{
		id: 'p-1001',
		title: 'My JOIN returns duplicate rows after adding department table',
		summary:
			'I added a department relation and now each employee appears 2-3 times.',
		description:
			'Database is MySQL. employees joins employee_projects and departments. I need one row per employee with project count.',
		tags: ['mysql', 'join', 'group-by'],
		ownerId: '2f38e01b-501f-45dc-b5e8-4595c0f1d142',
		ownerName: 'Lan Data',
		createdAt: '2026-03-05',
		votes: 14,
		views: 402,
		isResolved: true,
		resolvedById: mockProfileId,
		resolvedByName: 'Engineer HN',
		answers: [
			{
				id: 'a-3001',
				authorId: mockProfileId,
				authorName: 'Engineer HN',
				content:
					'Aggregate in a subquery first, then join departments. Your current join multiplies rows before COUNT.',
				createdAt: '2026-03-05',
				votes: 22,
				isAccepted: true,
			},
			{
				id: 'a-3002',
				authorId: 'be6f7447-8f29-43aa-a16f-79c6905cae4e',
				authorName: 'Minh Ops',
				content:
					'Try COUNT(DISTINCT employee_id) if you need a quick patch, but subquery is cleaner.',
				createdAt: '2026-03-06',
				votes: 6,
			},
		],
	},
	{
		id: 'p-1002',
		title: 'Postgres query plan changed after index creation',
		summary:
			'Created index but planner still chooses sequential scan on large table.',
		description:
			'EXPLAIN ANALYZE picks seq scan even with low selectivity predicate. Is stats issue or cost params?',
		tags: ['postgresql', 'query-plan', 'index'],
		ownerId: 'b0abf77f-61f2-47a9-8b5b-b8c96f05b455',
		ownerName: 'Nhat DBA',
		createdAt: '2026-03-04',
		votes: 19,
		views: 577,
		isResolved: true,
		resolvedById: mockProfileId,
		resolvedByName: 'Engineer HN',
		answers: [
			{
				id: 'a-3101',
				authorId: mockProfileId,
				authorName: 'Engineer HN',
				content:
					'Run ANALYZE, verify histogram stats, and inspect random_page_cost. Planner may still prefer seq scan when selectivity is poor.',
				createdAt: '2026-03-04',
				votes: 31,
				isAccepted: true,
			},
		],
	},
	{
		id: 'p-1003',
		title: 'How to model audit logs without killing write performance?',
		summary:
			'Need immutable audit trail for updates/deletes with high write volume.',
		description:
			'Currently app writes to audit table on every mutation. Write latency increased a lot.',
		tags: ['architecture', 'audit-log', 'performance'],
		ownerId: 'ce4e2d14-9cbc-43b4-885e-f4d2a3deeb6e',
		ownerName: 'Trang Backend',
		createdAt: '2026-03-03',
		votes: 11,
		views: 228,
		isResolved: false,
		answers: [
			{
				id: 'a-3201',
				authorId: 'be6f7447-8f29-43aa-a16f-79c6905cae4e',
				authorName: 'Minh Ops',
				content:
					'Buffer events to queue and batch insert asynchronously. Keep strict ordering key per entity.',
				createdAt: '2026-03-03',
				votes: 9,
			},
		],
	},
	{
		id: 'p-1004',
		title: 'SQLite file locked when multiple local tools open',
		summary:
			'My local app and DB browser conflict often. Any safe config workaround?',
		description:
			'Single dev machine, but frequent lock errors during reads and writes.',
		tags: ['sqlite', 'locking', 'local-dev'],
		ownerId: 'f70a9f1d-84a3-453e-9028-fef9e557aa8e',
		ownerName: 'Quang FE',
		createdAt: '2026-03-01',
		votes: 8,
		views: 190,
		isResolved: true,
		resolvedById: 'be6f7447-8f29-43aa-a16f-79c6905cae4e',
		resolvedByName: 'Minh Ops',
		answers: [
			{
				id: 'a-3301',
				authorId: 'be6f7447-8f29-43aa-a16f-79c6905cae4e',
				authorName: 'Minh Ops',
				content:
					'Enable WAL mode and use shorter write transactions. Avoid opening same file in write mode from two tools.',
				createdAt: '2026-03-01',
				votes: 15,
				isAccepted: true,
			},
		],
	},
]

export const notificationItems: NotificationItem[] = [
	{
		id: 'n-1001',
		type: 'problem',
		title: 'Your answer was marked as accepted',
		message:
			'Lan Data accepted your answer in "Postgres query plan changed after index creation".',
		createdAt: '2026-03-10 09:12',
		isRead: false,
		actionUrl: '/problems/p-1002',
	},
	{
		id: 'n-1002',
		type: 'mention',
		title: 'You were mentioned in a discussion',
		message:
			'Nhat DBA mentioned you in a thread about index selectivity regression.',
		createdAt: '2026-03-10 08:47',
		isRead: false,
		actionUrl: '/problems/p-1002',
	},
	{
		id: 'n-1003',
		type: 'system',
		title: 'Beta maintenance window scheduled',
		message:
			'Preview environment may be unstable from 23:00 to 23:30 (UTC+7) tonight.',
		createdAt: '2026-03-09 18:00',
		isRead: false,
	},
	{
		id: 'n-1004',
		type: 'blog',
		title: 'New community blog posted',
		message:
			'"Schema Migration Playbook For Busy Teams" is now available in Engineering Blog.',
		createdAt: '2026-03-09 10:25',
		isRead: true,
		actionUrl: '/blog/schema-migration-playbook',
	},
	{
		id: 'n-1005',
		type: 'problem',
		title: 'Problem you follow has a new answer',
		message:
			'"How to model audit logs without killing write performance?" received a new response.',
		createdAt: '2026-03-08 16:40',
		isRead: true,
		actionUrl: '/problems/p-1003',
	},
]
