/**
 * Migration utility to assign existing data to teams
 * This should be run once to migrate existing single-user data to team-based structure
 */

import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { teamService } from './teams';

/**
 * Migrate existing data to teams
 * For each user, creates a default team and assigns their data to it
 */
export async function migrateDataToTeams(): Promise<void> {
  console.log('Starting data migration to teams...');

  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.size} users to migrate`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`Migrating data for user: ${userId}`);

      // Get or create default team for user
      const userName = userData.name || userData.displayName || 'User';
      const team = await teamService.getOrCreateDefaultTeam(userId, userName);
      console.log(`  Team: ${team.name} (${team.id})`);

      // Migrate changelog posts
      const changelogRef = collection(db, 'changelog');
      const postsWithoutTeam = query(changelogRef, where('teamId', '==', null));
      const postsSnapshot = await getDocs(postsWithoutTeam);
      
      // Also get posts that don't have teamId field at all
      const allPostsSnapshot = await getDocs(changelogRef);
      const postsToMigrate = allPostsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.teamId;
      });

      console.log(`  Found ${postsToMigrate.length} posts to migrate`);
      
      for (const postDoc of postsToMigrate) {
        await updateDoc(doc(db, 'changelog', postDoc.id), {
          teamId: team.id,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      // Migrate segments
      const segmentsRef = collection(db, 'segments');
      const allSegmentsSnapshot = await getDocs(segmentsRef);
      const segmentsToMigrate = allSegmentsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.teamId;
      });

      console.log(`  Found ${segmentsToMigrate.length} segments to migrate`);
      
      for (const segmentDoc of segmentsToMigrate) {
        await updateDoc(doc(db, 'segments', segmentDoc.id), {
          teamId: team.id,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      // Note: Analytics data (visitors, post_views, widget_events) are typically
      // associated with posts, so they'll be implicitly scoped by team through the posts.
      // If you need explicit teamId on analytics, you can add it here.

      console.log(`  Completed migration for user: ${userId}`);
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}

/**
 * Run migration (call this manually or from admin panel)
 * This is a one-time operation
 */
export async function runMigration(): Promise<void> {
  if (typeof window === 'undefined') {
    console.error('Migration must be run from browser context');
    return;
  }

  const confirmed = confirm(
    'This will migrate all existing data to teams. ' +
    'Each user will get a default team and their data will be assigned to it. ' +
    'Continue?'
  );

  if (!confirmed) {
    console.log('Migration cancelled');
    return;
  }

  try {
    await migrateDataToTeams();
    alert('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    alert('Migration failed. Check console for details.');
  }
}
