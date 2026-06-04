import type {
  AppState, CompletedWorkout, DailyQuest, DayOfWeek, PlayerRank, PlayerStats,
  ProgressionEvent, ProgressionProfile, RecoveryChain, UserProfile, WorkoutDay, WorkoutPlan,
} from '@/types';

export const CURRENT_SCHEMA_VERSION = 4;

const DAY_NAMES: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function dateKey(input: number | Date = new Date()): string {
  const d = input instanceof Date ? input : new Date(input);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(key: string, days: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function rankForLevel(level: number): PlayerRank {
  if (level >= 90) return 'SSS';
  if (level >= 70) return 'SS';
  if (level >= 50) return 'S';
  if (level >= 35) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

export function xpForLevel(level: number): number {
  return Math.max(0, (level - 1) ** 2 * 100);
}

export function workoutXp(workout: Pick<CompletedWorkout, 'exercises' | 'duration'>): number {
  const sets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter(set => set.completed !== false).length, 0);
  return 80 + sets * 12 + Math.min(Math.max(workout.duration, 0), 120) * 2;
}

function clampStat(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function deriveStats(workouts: CompletedWorkout[], streak: number, recoveryParts: number): PlayerStats {
  const totalSets = workouts.reduce((sum, workout) => sum + workout.exercises.reduce((s, exercise) => s + exercise.sets.length, 0), 0);
  const totalVolume = workouts.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const totalMinutes = workouts.reduce((sum, workout) => sum + workout.duration, 0);
  return {
    strength: clampStat(1 + totalSets / 7 + Math.log10(totalVolume + 1) * 3),
    endurance: clampStat(1 + totalMinutes / 45 + workouts.length * 0.7),
    consistency: clampStat(1 + workouts.length * 1.4 + streak * 3),
    discipline: clampStat(1 + totalSets / 9 + workouts.length * 1.8),
    recovery: clampStat(1 + recoveryParts * 8 + Math.min(workouts.length, 30) * 0.6),
  };
}

export function buildProgression(workouts: CompletedWorkout[], streak: number, recoveryParts = 0): ProgressionProfile {
  const xp = workouts.filter(workout => workout.progressionAwarded !== false).reduce((sum, workout) => sum + workoutXp(workout), 0) + recoveryParts * 100;
  const level = levelForXp(xp);
  return { xp, level, rank: rankForLevel(level), stats: deriveStats(workouts, streak, recoveryParts), completedRecoveryParts: recoveryParts };
}

function prescribedSets(workout: WorkoutDay): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}

export function questForDate(plan: WorkoutPlan | null, key = dateKey()): DailyQuest | null {
  if (!plan) return null;
  const workout = plan.days.find(day => day.dayOfWeek === DAY_NAMES[dateFromKey(key).getDay()]);
  if (!workout) return null;
  const sets = prescribedSets(workout);
  return {
    id: `daily:${key}:${workout.id}`,
    dateKey: key,
    workoutDayId: workout.id,
    title: workout.name,
    prescribedSets: sets,
    status: 'active',
    xpReward: 80 + sets * 12 + 60,
  };
}

function recoveryWorkout(source: WorkoutDay, index: number, profile: UserProfile): WorkoutDay {
  const chunkSize = Math.max(1, Math.ceil(source.exercises.length / 3));
  const start = (index * chunkSize) % source.exercises.length;
  const picked = [...source.exercises.slice(start, start + chunkSize)];
  if (picked.length === 0) picked.push(...source.exercises.slice(0, chunkSize));
  return {
    id: `recovery:${source.id}:${index + 1}`,
    name: `Recovery Protocol ${index + 1}`,
    dayOfWeek: DAY_NAMES[dateFromKey(addDays(dateKey(), index + 1)).getDay()],
    splitLabel: `${profile.fitnessLevel.toUpperCase()} RECOVERY`,
    exercises: picked.map(item => ({ ...item, sets: Math.max(1, Math.ceil(item.sets * 1.25)), completedSets: [] })),
  };
}

export function createRecoveryChain(sourceQuest: DailyQuest, source: WorkoutDay, profile: UserProfile): RecoveryChain {
  const start = dateKey();
  return {
    id: `recovery-chain:${sourceQuest.id}`,
    sourceQuestId: sourceQuest.id,
    createdAt: Date.now(),
    status: 'active',
    objectives: [0, 1, 2].map(index => {
      const workout = recoveryWorkout(source, index, profile);
      return {
        id: `recovery-objective:${sourceQuest.id}:${index + 1}`,
        dueDateKey: addDays(start, index),
        status: 'active',
        workout,
        xpReward: 100 + prescribedSets(workout) * 10,
      };
    }),
  };
}

function event(type: ProgressionEvent['type'], title: string, message: string): ProgressionEvent {
  return { id: `${Date.now()}:${type}:${Math.random().toString(36).slice(2, 7)}`, type, title, message, createdAt: Date.now() };
}

export function syncQuests(state: AppState): AppState {
  if (!state.onboardingCompleted || !state.workoutPlan || !state.userProfile) return state;
  const today = dateKey();
  let changed = state.lastQuestSyncDate !== today;
  let streak = state.currentStreak;
  let recoveryChain = state.recoveryChain;
  let events = state.systemEvents;
  let firedReminderKeys = state.firedReminderKeys.filter(key => key >= addDays(today, -7));
  const activeWorkoutSessions = Object.fromEntries(
    Object.entries(state.activeWorkoutSessions).filter(([, session]) => session.dateKey >= today)
  );
  if (Object.keys(activeWorkoutSessions).length !== Object.keys(state.activeWorkoutSessions).length) changed = true;
  const quests = [...state.dailyQuests];
  let cursor = state.lastQuestSyncDate;
  while (cursor < today) {
    cursor = addDays(cursor, 1);
    const generated = questForDate(state.workoutPlan, cursor);
    if (generated && !quests.some(quest => quest.id === generated.id)) quests.push(generated);
  }
  const evaluatedQuests = quests.map(quest => {
    if (quest.status === 'active' && quest.dateKey < today) {
      changed = true;
      streak = 0;
      const missed = { ...quest, status: 'missed' as const };
      if (!recoveryChain || recoveryChain.status === 'completed') {
        const source = state.workoutPlan?.days.find(day => day.id === quest.workoutDayId);
        if (source) recoveryChain = createRecoveryChain(missed, source, state.userProfile!);
      }
      events = [event('quest_failed', 'QUEST FAILED', `${quest.title} expired. Recovery protocol assigned.`), ...events].slice(0, 30);
      return missed;
    }
    return quest;
  });
  const todayQuest = questForDate(state.workoutPlan, today);
  if (todayQuest && !evaluatedQuests.some(quest => quest.id === todayQuest.id)) {
    evaluatedQuests.push(todayQuest);
    changed = true;
  }
  const now = new Date();
  const todayName = DAY_NAMES[now.getDay()];
  const reminder = state.userProfile.reminderSettings.find(item => item.day === todayName && item.enabled);
  if (reminder) {
    const reminderKey = `${today}:${reminder.day}:${reminder.time}`;
    const [hour, minute] = reminder.time.split(':').map(Number);
    if (!firedReminderKeys.includes(reminderKey) && (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute))) {
      events = [event('reminder', 'QUEST REMINDER', todayQuest ? `${todayQuest.title} is awaiting completion.` : 'Review your recovery and nutrition directives.'), ...events].slice(0, 30);
      firedReminderKeys = [...firedReminderKeys, reminderKey];
      changed = true;
    }
  }
  if (!changed) return state;
  return { ...state, currentStreak: streak, dailyQuests: evaluatedQuests, recoveryChain, systemEvents: events, firedReminderKeys, activeWorkoutSessions, lastQuestSyncDate: today, progression: { ...state.progression, stats: deriveStats(state.completedWorkouts, streak, state.progression.completedRecoveryParts) } };
}

export function completeProgression(state: AppState, workout: CompletedWorkout): AppState {
  const previous = state.progression;
  let recoveryParts = previous.completedRecoveryParts;
  let recoveryChain = state.recoveryChain;
  let dailyQuests = state.dailyQuests;
  let streak = state.currentStreak;
  let events = state.systemEvents;
  const now = Date.now();
  const quest = dailyQuests.find(item => item.workoutDayId === workout.workoutDayId && item.status === 'active' && item.dateKey === dateKey(workout.date));
  if (quest) {
    dailyQuests = dailyQuests.map(item => item.id === quest.id ? { ...item, status: 'completed', completedAt: now } : item);
    events = [event('quest_complete', 'QUEST COMPLETE', `${quest.title} cleared.`), ...events];
  }
  const recovery = recoveryChain?.objectives.find(item => item.workout.id === workout.workoutDayId && item.status === 'active');
  const grantsProgression = Boolean(quest || recovery);
  if (recovery && recoveryChain) {
    recoveryParts += 1;
    const objectives = recoveryChain.objectives.map(item => item.id === recovery.id ? { ...item, status: 'completed' as const, completedAt: now } : item);
    const complete = objectives.every(item => item.status === 'completed');
    recoveryChain = { ...recoveryChain, objectives, status: complete ? 'completed' : 'active' };
    streak = complete ? 1 : 0;
    if (complete) {
      streak = 1;
      events = [event('recovery_complete', 'PROTOCOL COMPLETE', 'Recovery chain cleared. A new streak has begun.'), ...events];
    }
  }
  if (recoveryChain?.status === 'active') streak = 0;
  const rewardedWorkout = { ...workout, progressionAwarded: grantsProgression };
  const workouts = [...state.completedWorkouts, rewardedWorkout];
  const calculated = buildProgression(workouts, streak, recoveryParts);
  const progression = grantsProgression ? calculated : { ...previous, stats: calculated.stats };
  if (grantsProgression) {
    const gained = progression.xp - previous.xp;
    events = [event('xp_gain', `+${gained} XP`, 'Training data accepted by the System.'), ...events];
    if (progression.rank !== previous.rank) events = [event('rank_up', 'RANK ADVANCED', `${previous.rank} -> ${progression.rank}`), ...events];
    else if (progression.level > previous.level) events = [event('level_up', 'LEVEL UP', `Level ${progression.level} reached.`), ...events];
  }
  return { ...state, completedWorkouts: workouts, currentStreak: streak, dailyQuests, recoveryChain, progression, systemEvents: events.slice(0, 30) };
}
