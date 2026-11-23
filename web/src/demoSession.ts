const sessionKey = 'turno:demo-session';

export function hasDemoSession() {
  return sessionStorage.getItem(sessionKey) === 'active';
}

export function startDemoSession(email: string, password: string) {
  const validEmail = email.trim().toLowerCase() === 'davidberuzo@gmail.com';
  const validPassword = password === '1903Fbpa';

  if (!validEmail || !validPassword) {
    return false;
  }

  sessionStorage.setItem(sessionKey, 'active');
  return true;
}

export function endDemoSession() {
  sessionStorage.removeItem(sessionKey);
}