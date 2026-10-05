// Only the database binding is replaced; all game functions and Firestore calls are real.
export let db;
export function useDatabase(database) {
  db = database;
}
