import { supabase } from './supabase';

export const logActivity = async (userId, activity) => {
  await supabase.from('activity_feed').insert({
    user_id: userId,
    ...activity,
  });
};

export const ACTIVITY_TYPES = {
  JOB_ADDED: 'job_added',
  JOB_STATUS: 'job_status',
  PROJECT_ADDED: 'project_added',
  PROJECT_UPDATED: 'project_updated',
  SESSION_LOGGED: 'session_logged',
  GOAL_COMPLETED: 'goal_completed',
  STREAK_MILESTONE: 'streak_milestone',
};