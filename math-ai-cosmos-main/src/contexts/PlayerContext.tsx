import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, getProgress, upsertProgress, enqueueOffline, syncOfflineProgress, ProgressPayload, saveAchievement, getAchievementStats, Achievement, AchievementStats } from '@/lib/database';

export type CadetAvatarId = 'marisse' | 'charmelle' | 'chriselle' | 'king' | 'jeremiah';

// --- BEGIN ADD: progress state ---
export type CurrentProgress = {
  module_id: string | null;
  section_id: string | null;
  slide_index: number;    // default 0
  progress_pct: number;   // default 0
  updated_at?: string | null;
};

export type PlanetProgress = {
  mercury: number;
  venus: number;
  earth: number;
  mars: number;
  jupiter: number;
  saturn: number;
  uranus: number;
  neptune: number;
};
// --- END ADD ---

interface PlayerStats {
	level: number;
	currentXP: number;
	nextLevelXP: number;
	stardust: number;
	relics: number;
	awardedSources: Record<string, boolean>;
}

interface PlayerContextValue {
	cadetAvatar: CadetAvatarId;
	setCadetAvatar: (avatar: CadetAvatarId) => void;
	level: number;
	currentXP: number;
	nextLevelXP: number;
	stardust: number;
	relics: number;
	awardXP: (amount: number, sourceId?: string) => void;
	addStardust: (amount: number) => void;
	addRelic: (amount?: number) => void;
	// --- BEGIN ADD: progress methods ---
	currentProgress: CurrentProgress;
	loadProgress: (userId: string) => Promise<void>;
	saveProgress: (userId: string, next: CurrentProgress) => Promise<void>;
	completeLesson: (userId: string, lessonData: any) => Promise<boolean>;
	getOverallProgress: () => number;
	// --- END ADD ---
	// --- BEGIN ADD: achievement methods ---
	saveAchievement: (achievement: Omit<Achievement, 'id' | 'completedAt'>) => Promise<void>;
	getAchievementStats: () => Promise<AchievementStats>;
	// --- END ADD ---
}

const DEFAULT_AVATAR: CadetAvatarId = 'king';
const AVATAR_STORAGE_KEY = 'player.cadetAvatar';
const STATS_KEY_PREFIX = 'player.stats.'; // per-user stats

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const usePlayer = (): PlayerContextValue => {
	const ctx = useContext(PlayerContext);
	if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
	return ctx;
};

function getDefaultStats(): PlayerStats {
	return {
		level: 1,
		currentXP: 0,
		nextLevelXP: 500,
		stardust: 0,
		relics: 0,
		awardedSources: {},
	};
}

function computeNextLevelXP(level: number): number {
	// Gentle curve: base 500, +250 per level
	return 500 + (level - 1) * 250;
}

export const PlayerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [cadetAvatar, setCadetAvatarState] = useState<CadetAvatarId>(DEFAULT_AVATAR);
	const { user } = useAuth();
	const [stats, setStats] = useState<PlayerStats>(getDefaultStats());

	// --- BEGIN ADD: progress state + updater ---
	const [currentProgress, setCurrentProgress] = useState<CurrentProgress>({
		module_id: null,
		section_id: null,
		slide_index: 0,
		progress_pct: 0,
		updated_at: null,
	});

	async function loadProgress(userId: string) {
		try {
			const p = await getProgress(userId);
			setCurrentProgress({
				module_id: p.module_id,
				section_id: p.section_id,
				slide_index: p.slide_index ?? 0,
				progress_pct: p.progress_pct ?? 0,
				updated_at: p.updated_at ?? null,
			});
		} catch {}
	}

	async function saveProgress(userId: string, next: CurrentProgress) {
		setCurrentProgress(next); // optimistic
		const payload = {
			user_id: userId,
			module_id: next.module_id || 'RationalEq',
			section_id: next.section_id || 'S1',
			slide_index: next.slide_index ?? 0,
			progress_pct: next.progress_pct ?? 0,
		};
		try {
			await upsertProgress(payload);
		} catch {
			enqueueOffline(payload);
		}
	}

	// New optimized lesson completion function
	async function completeLesson(userId: string, lessonData: {
		lessonId: string;
		lessonName: string;
		score: number;
		timeSpent: number;
		equationsSolved: string[];
		mistakes: string[];
		skillBreakdown?: any;
		xpEarned: number;
		planetName: string;
	}) {
		try {
			// Award XP immediately for better user experience
			awardXP(lessonData.xpEarned, `${lessonData.lessonId}-completed`);
			
			// Save achievement
			await saveAchievementLocal({
				userId,
				lessonId: lessonData.lessonId,
				lessonName: lessonData.lessonName,
				lessonType: 'solar-system',
				xpEarned: lessonData.xpEarned,
				planetName: lessonData.planetName,
			});
			
			// Save lesson completion to database
			await db.saveStudentProgress({
				studentId: userId,
				moduleId: lessonData.lessonId,
				moduleName: lessonData.lessonName,
				completedAt: new Date(),
				score: lessonData.score,
				timeSpent: lessonData.timeSpent,
				equationsSolved: lessonData.equationsSolved,
				mistakes: lessonData.mistakes,
				skillBreakdown: lessonData.skillBreakdown,
			} as any);
			
			// Update progress to 100%
			await saveProgress(userId, {
				module_id: lessonData.lessonId,
				section_id: 'section_0',
				slide_index: 999, // Indicates completion
				progress_pct: 100,
			});
			
			return true;
		} catch (error) {
			console.error('Lesson completion failed:', error);
			// Fallback: just save progress
			try {
				await saveProgress(userId, {
					module_id: lessonData.lessonId,
					section_id: 'section_0',
					slide_index: 999,
					progress_pct: 100,
				});
			} catch (fallbackError) {
				console.error('Fallback progress save also failed:', fallbackError);
			}
			return false;
		}
	}

	function getOverallProgress(): number {
		// Calculate overall progress across all planets
		// For now, we'll use a simple calculation based on current planet progress
		// In the future, this could be enhanced to fetch progress for all planets
		const planetOrder = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
		const currentPlanetIndex = planetOrder.findIndex(planet => planet === currentProgress.module_id);
		
		if (currentPlanetIndex === -1) return 0;
		
		// Calculate progress: completed planets + current planet progress
		const completedPlanets = currentPlanetIndex;
		const currentPlanetProgress = currentProgress.progress_pct / 100;
		const totalProgress = (completedPlanets + currentPlanetProgress) / planetOrder.length;
		
		return Math.round(totalProgress * 100);
	}
	// --- END ADD ---

	const statsKey = `${STATS_KEY_PREFIX}${user?.id || 'guest'}`;

	useEffect(() => {
		try {
			const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
			if (saved) setCadetAvatarState(JSON.parse(saved) as CadetAvatarId);
		} catch {}
	}, []);

	// Load avatar from user profile if present
	useEffect(() => {
		(async () => {
			try {
				if (user) {
					const fresh = await db.getUserById(user.id);
					if ((fresh as any)?.cadetAvatar) {
						setCadetAvatarState((fresh as any).cadetAvatar as CadetAvatarId);
						localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify((fresh as any).cadetAvatar));
					}
				}
			} catch {}
		})();
	}, [user]);

	// Load stats when user changes
	useEffect(() => {
		try {
			const saved = localStorage.getItem(statsKey);
			if (saved) {
				const parsed = JSON.parse(saved) as PlayerStats;
				// Ensure nextLevelXP matches curve if missing
				if (!parsed.nextLevelXP) parsed.nextLevelXP = computeNextLevelXP(parsed.level || 1);
				if (!parsed.awardedSources) parsed.awardedSources = {};
				setStats(parsed);
			} else {
				setStats(getDefaultStats());
			}
		} catch {
			setStats(getDefaultStats());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	// --- BEGIN ADD: gentle polling effect ---
	useEffect(() => {
		let t: number | undefined;
		async function tick() {
			if (!user?.id) return;
			try { await syncOfflineProgress(); } catch {}
			try { await loadProgress(user.id); } catch {}
			t = window.setTimeout(tick, 5000);
		}
		t = window.setTimeout(tick, 5000);
		return () => { if (t) window.clearTimeout(t); };
	}, [user?.id]);
	// --- END ADD ---

	const persistStats = (next: PlayerStats) => {
		try { localStorage.setItem(statsKey, JSON.stringify(next)); } catch {}
	};

	const setCadetAvatar = (avatar: CadetAvatarId) => {
		setCadetAvatarState(avatar);
		try {
			localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatar));
			// TODO: Implement user avatar update in database
			// if (user) {
			// 	void db.updateUserCadetAvatar(user.id, avatar as any);
			// }
		} catch {}
	};

	const awardXP = (amount: number, sourceId?: string) => {
		if (!amount || amount <= 0) return;
		setStats(prev => {
			if (sourceId && prev.awardedSources[sourceId]) {
				return prev; // already awarded for this source
			}
			let newXP = prev.currentXP + amount;
			let newLevel = prev.level;
			let nextXP = prev.nextLevelXP;
			let stardust = prev.stardust;
			let relics = prev.relics;
			const awardedSources = { ...prev.awardedSources };
			if (sourceId) awardedSources[sourceId] = true;
			// Level up loop in case large XP grants
			while (newXP >= nextXP) {
				newXP -= nextXP;
				newLevel += 1;
				nextXP = computeNextLevelXP(newLevel);
				stardust += 50; // small reward per level
			}
			const next = { level: newLevel, currentXP: newXP, nextLevelXP: nextXP, stardust, relics, awardedSources };
			persistStats(next);
			return next;
		});
	};

	const addStardust = (amount: number) => {
		if (!amount) return;
		setStats(prev => {
			const next = { ...prev, stardust: Math.max(0, prev.stardust + amount) };
			persistStats(next);
			return next;
		});
	};

	const addRelic = (amount = 1) => {
		if (!amount) return;
		setStats(prev => {
			const next = { ...prev, relics: Math.max(0, prev.relics + amount) };
			persistStats(next);
			return next;
		});
	};

	// --- BEGIN ADD: achievement methods ---
	const saveAchievementLocal = async (achievement: Omit<Achievement, 'id' | 'completedAt'>) => {
		if (!user?.id) return;
		await saveAchievement({ ...achievement, userId: user.id });
	};

	const getAchievementStatsLocal = async (): Promise<AchievementStats> => {
		if (!user?.id) return {
			totalXP: 0,
			lessonsCompleted: 0,
			solarSystemLessons: 0,
			philippinesMapLessons: 0,
			achievements: [],
		};
		return await getAchievementStats(user.id);
	};
	// --- END ADD ---

	const value = useMemo<PlayerContextValue>(() => ({
		cadetAvatar,
		setCadetAvatar,
		level: stats.level,
		currentXP: stats.currentXP,
		nextLevelXP: stats.nextLevelXP,
		stardust: stats.stardust,
		relics: stats.relics,
		awardXP,
		addStardust,
		addRelic,
		// --- BEGIN ADD: context value ---
		currentProgress,
		loadProgress,
		saveProgress,
		completeLesson,
		getOverallProgress,
		// --- END ADD ---
		// --- BEGIN ADD: achievement context value ---
		saveAchievement: saveAchievementLocal,
		getAchievementStats: getAchievementStatsLocal,
		// --- END ADD ---
	}), [cadetAvatar, stats, currentProgress]);

	return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};


