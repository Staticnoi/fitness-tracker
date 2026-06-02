import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  // CHEST
  {
    id: 'push_up', name: 'Push-Up', targetMuscle: 'chest', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '10-15', restTime: 60,
    instructions: ['Start in plank position, hands shoulder-width apart', 'Lower chest to floor keeping body straight', 'Push back up explosively'],
    commonMistakes: ['Flaring elbows too wide', 'Sagging hips', 'Not reaching full depth'],
    safetyNotes: 'Keep core tight throughout. Stop if wrist pain occurs.', category: 'push',
  },
  {
    id: 'wide_push_up', name: 'Wide Push-Up', targetMuscle: 'chest', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '10-12', restTime: 60,
    instructions: ['Place hands wider than shoulders', 'Lower chest focusing on stretch', 'Press back to start'],
    commonMistakes: ['Elbows pointing backward', 'Partial range of motion'],
    safetyNotes: 'Avoid excessive elbow flare to protect shoulders.', category: 'push',
  },
  {
    id: 'decline_push_up', name: 'Decline Push-Up', targetMuscle: 'chest', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '8-12', restTime: 75,
    instructions: ['Place feet on elevated surface', 'Hands on floor below shoulders', 'Perform push-up with upper chest emphasis'],
    commonMistakes: ['Letting hips sag', 'Too fast on the descent'],
    safetyNotes: 'Use a stable elevated surface.', category: 'push',
  },
  {
    id: 'dumbbell_press', name: 'Dumbbell Bench Press', targetMuscle: 'chest', equipment: ['dumbbells'],
    difficulty: 'intermediate', sets: 4, reps: '8-12', restTime: 90,
    instructions: ['Lie on bench, dumbbells at chest level', 'Press up and slightly inward', 'Lower slowly with control'],
    commonMistakes: ['Bouncing off chest', 'Uneven pressing', 'Too much arch'],
    safetyNotes: 'Keep feet flat on floor. Have a spotter for heavy weights.', category: 'push',
  },
  {
    id: 'barbell_bench', name: 'Barbell Bench Press', targetMuscle: 'chest', equipment: ['barbells'],
    difficulty: 'intermediate', sets: 4, reps: '5-8', restTime: 120,
    instructions: ['Grip bar slightly wider than shoulders', 'Unrack and lower to lower chest', 'Drive bar up in a slight arc'],
    commonMistakes: ['Flared elbows', 'Losing back arch', 'Bar path too vertical'],
    safetyNotes: 'Always use a spotter or safety catches.', category: 'push', avoidFor: ['arms_shoulders'],
  },
  {
    id: 'cable_fly', name: 'Cable Fly', targetMuscle: 'chest', equipment: ['machines'],
    difficulty: 'intermediate', sets: 3, reps: '12-15', restTime: 60,
    instructions: ['Set cables at chest height', 'Step forward, arms wide', 'Bring hands together in arc motion'],
    commonMistakes: ['Using too much weight', 'Jerky motion', 'Bending elbows too much'],
    safetyNotes: 'Keep a slight elbow bend. Control the return phase.', category: 'push',
  },
  // BACK
  {
    id: 'pull_up', name: 'Pull-Up', targetMuscle: 'back', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '5-10', restTime: 90,
    instructions: ['Hang from bar with overhand grip', 'Pull elbows down and back', 'Chin over bar, lower with control'],
    commonMistakes: ['Kipping swinging', 'Not full ROM', 'Forward head position'],
    safetyNotes: 'Dead hang fully between reps. Avoid if shoulder pain occurs.', category: 'pull', avoidFor: ['arms_shoulders'],
  },
  {
    id: 'inverted_row', name: 'Inverted Row', targetMuscle: 'back', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '10-15', restTime: 60,
    instructions: ['Lie under bar/table, grip overhand', 'Pull chest to bar keeping body straight', 'Lower with control'],
    commonMistakes: ['Hips sagging', 'Partial range of motion'],
    safetyNotes: 'Great pull-up progression. Adjust difficulty by foot position.', category: 'pull',
  },
  {
    id: 'dumbbell_row', name: 'Dumbbell Row', targetMuscle: 'back', equipment: ['dumbbells'],
    difficulty: 'beginner', sets: 4, reps: '10-12', restTime: 75,
    instructions: ['Brace on bench with one hand', 'Pull dumbbell to hip', 'Squeeze shoulder blade, lower slowly'],
    commonMistakes: ['Rotating torso excessively', 'Using momentum', 'Not retracting scapula'],
    safetyNotes: 'Keep back flat. Support opposite side on bench.', category: 'pull', avoidFor: ['back_hernia'],
  },
  {
    id: 'barbell_row', name: 'Barbell Row', targetMuscle: 'back', equipment: ['barbells'],
    difficulty: 'intermediate', sets: 4, reps: '6-10', restTime: 90,
    instructions: ['Hip hinge until torso near parallel', 'Pull bar to lower chest', 'Lower with control'],
    commonMistakes: ['Excessive torso swing', 'Rounding lower back', 'Bar too high'],
    safetyNotes: 'Keep neutral spine. Reduce weight if back rounds.', category: 'pull', avoidFor: ['back_hernia'],
  },
  {
    id: 'lat_pulldown', name: 'Lat Pulldown', targetMuscle: 'back', equipment: ['machines'],
    difficulty: 'beginner', sets: 4, reps: '10-12', restTime: 75,
    instructions: ['Grip bar wide, slight lean back', 'Pull bar to upper chest', 'Control the return'],
    commonMistakes: ['Pulling behind neck', 'Using momentum', 'Not stretching at top'],
    safetyNotes: 'Pull in front of head only. Keep chest up.', category: 'pull',
  },
  // ARMS
  {
    id: 'diamond_push_up', name: 'Diamond Push-Up', targetMuscle: 'arms', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '8-12', restTime: 60,
    instructions: ['Form diamond with hands under chest', 'Lower keeping elbows close', 'Press back up'],
    commonMistakes: ['Flaring elbows', 'Not completing full range'],
    safetyNotes: 'Stop if wrist pain occurs. Try fist push-ups as alternative.', category: 'push',
  },
  {
    id: 'dumbbell_curl', name: 'Dumbbell Bicep Curl', targetMuscle: 'arms', equipment: ['dumbbells'],
    difficulty: 'beginner', sets: 3, reps: '10-12', restTime: 60,
    instructions: ['Stand with dumbbells at sides', 'Curl to shoulder, supinate wrist', 'Lower slowly'],
    commonMistakes: ['Swinging torso', 'Not fully extending', 'Using too heavy weight'],
    safetyNotes: 'Keep elbows pinned to sides throughout.', category: 'pull',
  },
  {
    id: 'hammer_curl', name: 'Hammer Curl', targetMuscle: 'arms', equipment: ['dumbbells'],
    difficulty: 'beginner', sets: 3, reps: '10-12', restTime: 60,
    instructions: ['Hold dumbbells with neutral grip', 'Curl to shoulder, thumb up', 'Lower with control'],
    commonMistakes: ['Rotating wrist', 'Rushing reps'],
    safetyNotes: 'Neutral grip reduces wrist strain.', category: 'pull',
  },
  {
    id: 'tricep_dip', name: 'Tricep Dip', targetMuscle: 'arms', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '10-15', restTime: 60,
    instructions: ['Hands on bench behind you', 'Lower until arms 90 degrees', 'Push back up'],
    commonMistakes: ['Going too deep', 'Shrugging shoulders', 'Feet too far forward'],
    safetyNotes: 'Avoid if shoulder pain. Keep body close to bench.', category: 'push', avoidFor: ['arms_shoulders'],
  },
  {
    id: 'barbell_curl', name: 'Barbell Curl', targetMuscle: 'arms', equipment: ['barbells'],
    difficulty: 'intermediate', sets: 4, reps: '8-10', restTime: 75,
    instructions: ['Grip bar shoulder width', 'Curl to shoulder with control', 'Lower fully'],
    commonMistakes: ['Cheating with back', 'Partial reps at bottom'],
    safetyNotes: 'Straight bar can stress wrists. Use EZ bar if needed.', category: 'pull',
  },
  // SHOULDERS
  {
    id: 'pike_push_up', name: 'Pike Push-Up', targetMuscle: 'shoulders', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '8-12', restTime: 60,
    instructions: ['Form inverted V position', 'Lower head toward ground', 'Press back up'],
    commonMistakes: ['Not lowering enough', 'Wide hand placement'],
    safetyNotes: 'Keep neck neutral. Stop if neck discomfort.', category: 'push', avoidFor: ['arms_shoulders'],
  },
  {
    id: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', targetMuscle: 'shoulders', equipment: ['dumbbells'],
    difficulty: 'beginner', sets: 4, reps: '10-12', restTime: 75,
    instructions: ['Start at ear level, palms forward', 'Press overhead to lockout', 'Lower with control'],
    commonMistakes: ['Arching lower back', 'Pressing forward not up', 'Partial range'],
    safetyNotes: 'Keep core engaged. Seated variation reduces injury risk.', category: 'push', avoidFor: ['arms_shoulders'],
  },
  {
    id: 'lateral_raise', name: 'Lateral Raise', targetMuscle: 'shoulders', equipment: ['dumbbells'],
    difficulty: 'beginner', sets: 3, reps: '12-15', restTime: 60,
    instructions: ['Stand with dumbbells at sides', 'Raise to shoulder height, slight bend', 'Lower slowly 3 seconds'],
    commonMistakes: ['Shrugging traps', 'Using momentum', 'Going above shoulder height'],
    safetyNotes: 'Very light weight. Slow eccentric is key.', category: 'push', avoidFor: ['arms_shoulders'],
  },
  // ABS
  {
    id: 'plank', name: 'Plank', targetMuscle: 'abs', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '30-60s', restTime: 45,
    instructions: ['Forearm plank position', 'Body in straight line', 'Breathe steadily, hold'],
    commonMistakes: ['Hips too high/low', 'Holding breath', 'Looking up'],
    safetyNotes: 'Stop if lower back pain. Modify on knees if needed.', category: 'core', avoidFor: ['back_hernia'],
  },
  {
    id: 'crunch', name: 'Crunch', targetMuscle: 'abs', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '15-20', restTime: 45,
    instructions: ['Lie back, knees bent', 'Curl shoulder blades off floor', 'Lower with control'],
    commonMistakes: ['Pulling neck', 'Full sit-up motion', 'Too fast'],
    safetyNotes: 'Hands behind head lightly. No pulling on neck.', category: 'core', avoidFor: ['back_hernia'],
  },
  {
    id: 'bicycle_crunch', name: 'Bicycle Crunch', targetMuscle: 'abs', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '20-30', restTime: 45,
    instructions: ['Lie back, hands at temples', 'Alternate elbow to opposite knee', 'Slow deliberate rotation'],
    commonMistakes: ['Pulling neck', 'Too fast rushing', 'Not rotating'],
    safetyNotes: 'Slow and controlled beats fast and sloppy.', category: 'core', avoidFor: ['back_hernia'],
  },
  {
    id: 'leg_raise', name: 'Leg Raise', targetMuscle: 'abs', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '12-15', restTime: 60,
    instructions: ['Lie flat, hands under hips', 'Raise legs to 90 degrees', 'Lower without touching floor'],
    commonMistakes: ['Arching lower back', 'Bending knees too much'],
    safetyNotes: 'Press lower back into floor. Reduce range if needed.', category: 'core', avoidFor: ['back_hernia'],
  },
  {
    id: 'mountain_climber', name: 'Mountain Climber', targetMuscle: 'abs', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '20-30', restTime: 60,
    instructions: ['High plank position', 'Drive knees to chest alternately', 'Keep hips level'],
    commonMistakes: ['Hips rising', 'Too slow losing cardio benefit', 'Neck straining'],
    safetyNotes: 'Stop if knee pain. Can be modified to slow pace.', category: 'core', avoidFor: ['knee', 'no_jumps'],
  },
  // LEGS
  {
    id: 'squat', name: 'Bodyweight Squat', targetMuscle: 'legs', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '15-20', restTime: 60,
    instructions: ['Feet shoulder width', 'Push hips back and down', 'Chest up, knees over toes', 'Drive through heels'],
    commonMistakes: ['Knees caving in', 'Heels lifting', 'Forward lean'],
    safetyNotes: 'Use chair for assistance if needed. Stop if knee pain.', category: 'legs', avoidFor: ['knee'],
  },
  {
    id: 'lunge', name: 'Forward Lunge', targetMuscle: 'legs', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '10-12 each', restTime: 60,
    instructions: ['Step forward into lunge', 'Back knee near floor', 'Push back to start'],
    commonMistakes: ['Front knee over toes', 'Torso leaning forward', 'Long steps'],
    safetyNotes: 'Keep front knee behind toes. Use wall for balance.', category: 'legs', avoidFor: ['knee'],
  },
  {
    id: 'dumbbell_squat', name: 'Dumbbell Goblet Squat', targetMuscle: 'legs', equipment: ['dumbbells'],
    difficulty: 'beginner', sets: 4, reps: '10-12', restTime: 75,
    instructions: ['Hold dumbbell vertically at chest', 'Squat deep with chest up', 'Drive through heels'],
    commonMistakes: ['Elbows dropping', 'Heels lifting', 'Rounding back'],
    safetyNotes: 'Great for learning squat pattern. Keep weight manageable.', category: 'legs', avoidFor: ['knee'],
  },
  {
    id: 'romanian_deadlift', name: 'Romanian Deadlift', targetMuscle: 'legs', equipment: ['dumbbells'],
    difficulty: 'intermediate', sets: 3, reps: '10-12', restTime: 90,
    instructions: ['Hip hinge, slight knee bend', 'Lower weights down legs', 'Squeeze glutes to return'],
    commonMistakes: ['Rounding back', 'Bending knees too much', 'Looking up'],
    safetyNotes: 'This is hip dominant. Soft knees only.', category: 'legs', avoidFor: ['back_hernia'],
  },
  {
    id: 'barbell_squat', name: 'Barbell Back Squat', targetMuscle: 'legs', equipment: ['barbells'],
    difficulty: 'intermediate', sets: 4, reps: '5-8', restTime: 120,
    instructions: ['Bar on traps, feet shoulder width', 'Squat to parallel or below', 'Drive up through heels'],
    commonMistakes: ['Knees caving', 'Good morning forward lean', 'Heels lifting'],
    safetyNotes: 'Always use squat rack. Spotter recommended.', category: 'legs', avoidFor: ['knee', 'back_hernia'],
  },
  {
    id: 'leg_press', name: 'Leg Press', targetMuscle: 'legs', equipment: ['machines'],
    difficulty: 'beginner', sets: 4, reps: '10-15', restTime: 90,
    instructions: ['Feet shoulder width on platform', 'Release safety, lower platform', 'Press to near lockout'],
    commonMistakes: ['Feet too low', 'Knees caving', 'Full lockout (hyperextension)'],
    safetyNotes: 'Never fully lock out knees. Keep lower back on pad.', category: 'legs', avoidFor: ['knee'],
  },
  // GLUTES
  {
    id: 'glute_bridge', name: 'Glute Bridge', targetMuscle: 'glutes', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '15-20', restTime: 45,
    instructions: ['Lie back, feet flat, near hips', 'Push through heels, raise hips', 'Squeeze glutes at top'],
    commonMistakes: ['Hyperextending back', 'Feet too far away', 'Not squeezing at top'],
    safetyNotes: 'Great for hip health. Keep core engaged.', category: 'legs',
  },
  {
    id: 'hip_thrust', name: 'Hip Thrust', targetMuscle: 'glutes', equipment: ['dumbbells'],
    difficulty: 'intermediate', sets: 4, reps: '10-15', restTime: 75,
    instructions: ['Back on bench, weight on hips', 'Drive hips up', 'Squeeze glutes at top for 1s'],
    commonMistakes: ['Ribcage flaring', 'Not full range', 'Too fast'],
    safetyNotes: 'Use padding under weight for comfort.', category: 'legs',
  },
  {
    id: 'donkey_kick', name: 'Donkey Kick', targetMuscle: 'glutes', equipment: ['none_bodyweight'],
    difficulty: 'beginner', sets: 3, reps: '15-20 each', restTime: 45,
    instructions: ['On all fours', 'Kick one leg back and up', 'Squeeze glute at top'],
    commonMistakes: ['Rotating hip', 'Arching lower back', 'Foot position dropping'],
    safetyNotes: 'Keep core engaged to protect lower back.', category: 'legs',
  },
  // KETTLEBELL
  {
    id: 'kb_swing', name: 'Kettlebell Swing', targetMuscle: 'full_body', equipment: ['kettlebells'],
    difficulty: 'intermediate', sets: 4, reps: '15-20', restTime: 75,
    instructions: ['Hip hinge back', 'Swing KB through legs', 'Explosive hip snap to swing forward'],
    commonMistakes: ['Squatting instead of hinging', 'Using arms to lift', 'Overextending back'],
    safetyNotes: 'Power comes from hips. Learn the hip hinge first.', category: 'full_body', avoidFor: ['back_hernia'],
  },
  {
    id: 'kb_goblet_squat', name: 'Kettlebell Goblet Squat', targetMuscle: 'legs', equipment: ['kettlebells'],
    difficulty: 'beginner', sets: 3, reps: '12-15', restTime: 75,
    instructions: ['Hold KB at chest', 'Deep squat, elbows inside knees', 'Drive up through heels'],
    commonMistakes: ['Torso collapsing forward', 'Heels raising'],
    safetyNotes: 'Excellent mobility exercise. Use weight to counterbalance.', category: 'legs', avoidFor: ['knee'],
  },
  // FULL BODY
  {
    id: 'burpee', name: 'Burpee', targetMuscle: 'full_body', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '8-12', restTime: 90,
    instructions: ['Stand, drop to squat, kick legs back', 'Do push-up', 'Jump back to squat', 'Jump up with arms overhead'],
    commonMistakes: ['Sagging hips on push-up', 'Not jumping at end', 'Too fast losing form'],
    safetyNotes: 'High impact. Modify by stepping instead of jumping.', category: 'full_body', avoidFor: ['knee', 'no_jumps'],
  },
  {
    id: 'jump_squat', name: 'Jump Squat', targetMuscle: 'legs', equipment: ['none_bodyweight'],
    difficulty: 'intermediate', sets: 3, reps: '10-15', restTime: 75,
    instructions: ['Squat down to parallel', 'Explode up into jump', 'Land softly bending knees'],
    commonMistakes: ['Landing stiff', 'Not going low enough', 'Arms not helping'],
    safetyNotes: 'Land softly to protect joints.', category: 'legs', avoidFor: ['knee', 'no_jumps'],
  },
];

export const getExercisesForProfile = (
  equipment: string[],
  focusAreas: string[],
  healthIssues: string[],
  fitnessLevel: string
): Exercise[] => {
  return EXERCISES.filter(ex => {
    const hasEquipment = ex.equipment.some(e => equipment.includes(e));
    const isInFocus = focusAreas.includes('full_body') || focusAreas.includes(ex.targetMuscle as string);
    const notAvoided = !ex.avoidFor?.some(h => healthIssues.includes(h));
    const levelOk = fitnessLevel === 'advanced' || ex.difficulty !== 'advanced' ||
      (fitnessLevel === 'intermediate' && ex.difficulty !== 'advanced');
    return hasEquipment && isInFocus && notAvoided && levelOk;
  });
};
