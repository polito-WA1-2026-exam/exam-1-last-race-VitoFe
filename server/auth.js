import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { getUserByUsername, getUserById } from './dao.js';
import { verifyPassword } from './crypto_utils.js';

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    
    const isValid = await verifyPassword(password, user.hash, user.salt);
    if (!isValid) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    
    return done(null, { id: user.id, username: user.username });
  } catch (err) {
    return done(err);
  }
}));

// Serialize user into the session (store only user id)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user); // req.user will be populated with this object
  } catch (err) {
    done(err);
  }
});

export function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

export default passport;
