import { onSnapshot } from 'firebase/firestore';

// The subscription delivery boundary is separate from game and view logic, so
// delayed delivery can be exercised without substituting state or game rules.
export function observeLobby(ref, receive, onError) {
  return onSnapshot(ref, { includeMetadataChanges: true }, receive, onError);
}
