import { Store } from 'express-session';
import { db, COLLECTIONS } from './firebase.js';

export class FirebaseSessionStore extends Store {
  constructor(options: any = {}) {
    super(options);
    this.ttl = options.ttl || 7 * 24 * 60 * 60 * 1000; // 7 days default
  }

  private ttl: number;

  get(sid: string, callback: (err?: any, session?: any) => void): void {
    try {
      db.collection(COLLECTIONS.SESSIONS)
        .doc(sid)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            return callback(null, null);
          }

          const data = doc.data();
          const session = data?.sess;
          const expire = data?.expire?.toDate();

          if (!session || !expire) {
            return callback(null, null);
          }

          // Check if session has expired
          if (expire < new Date()) {
            this.destroy(sid, () => {});
            return callback(null, null);
          }

          callback(null, session);
        })
        .catch((error) => {
          callback(error);
        });
    } catch (error) {
      callback(error);
    }
  }

  set(sid: string, session: any, callback?: (err?: any) => void): void {
    try {
      const expire = new Date(Date.now() + this.ttl);
      const sessionData = {
        sid,
        sess: session,
        expire,
        updatedAt: new Date(),
      };

      db.collection(COLLECTIONS.SESSIONS)
        .doc(sid)
        .set(sessionData)
        .then(() => {
          if (callback) callback();
        })
        .catch((error) => {
          if (callback) callback(error);
        });
    } catch (error) {
      if (callback) callback(error);
    }
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    try {
      db.collection(COLLECTIONS.SESSIONS)
        .doc(sid)
        .delete()
        .then(() => {
          if (callback) callback();
        })
        .catch((error) => {
          if (callback) callback(error);
        });
    } catch (error) {
      if (callback) callback(error);
    }
  }

  touch(sid: string, session: any, callback?: (err?: any) => void): void {
    try {
      const expire = new Date(Date.now() + this.ttl);
      
      db.collection(COLLECTIONS.SESSIONS)
        .doc(sid)
        .update({
          expire,
          updatedAt: new Date(),
        })
        .then(() => {
          if (callback) callback();
        })
        .catch((error) => {
          if (callback) callback(error);
        });
    } catch (error) {
      if (callback) callback(error);
    }
  }

  all(callback: (err?: any, obj?: any) => void): void {
    try {
      db.collection(COLLECTIONS.SESSIONS)
        .get()
        .then((snapshot) => {
          const sessions: any = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data?.sess && data?.expire?.toDate() > new Date()) {
              sessions[doc.id] = data.sess;
            }
          });
          callback(null, sessions);
        })
        .catch((error) => {
          callback(error);
        });
    } catch (error) {
      callback(error);
    }
  }

  clear(callback?: (err?: any) => void): void {
    try {
      db.collection(COLLECTIONS.SESSIONS)
        .get()
        .then((snapshot) => {
          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          return batch.commit();
        })
        .then(() => {
          if (callback) callback();
        })
        .catch((error) => {
          if (callback) callback(error);
        });
    } catch (error) {
      if (callback) callback(error);
    }
  }

  length(callback: (err?: any, length?: number) => void): void {
    try {
      db.collection(COLLECTIONS.SESSIONS)
        .get()
        .then((snapshot) => {
          callback(null, snapshot.size);
        })
        .catch((error) => {
          callback(error);
        });
    } catch (error) {
      callback(error);
    }
  }
}