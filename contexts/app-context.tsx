'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toastError, toastSuccess } from '@/lib/toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'attendee' | 'admin';
  company?: string;
  phone?: string;
  bio?: string;
  createdAt?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  totalSlots: number;
  availableSlots: number;
  image: string;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  registrations?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  registeredAt: string;
  createdAt: string; // Alias for registeredAt or actual DB field
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;

  events: Event[];
  eventsLoading: boolean;
  registrations: Registration[];
  registerEvent: (eventId: string) => Promise<void>;
  cancelRegistration: (registrationId: string) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  getRegistrationsForUser: (userId: string) => Registration[];
  getRegistrationsForEvent: (eventId: string) => Registration[];
  getRegistrationByEventId: (eventId: string) => Registration | undefined;
  isRegisteredForEvent: (eventId: string) => boolean;

  // Admin functions
  users: User[];
  fetchUsers: () => Promise<void>;
  createEvent: (event: Omit<Event, 'id' | 'registrations'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  approveRegistration: (registrationId: string) => Promise<void>;
  rejectRegistration: (registrationId: string) => Promise<void>;
  markAttended: (registrationId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const apiRequest = useCallback(async (
    url: string,
    options?: RequestInit,
    notify?: {
      successTitle?: string
      successDescription?: string
      errorTitle?: string
      showSuccess?: boolean
      showError?: boolean
    }
  ) => {
    const method = String(options?.method ?? 'GET').toUpperCase()

    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      const message = payload?.details || payload?.error || 'Request failed.';
      if (notify?.showError ?? method !== 'GET') {
        toastError(notify?.errorTitle ?? 'Action failed', message);
      }
      throw new Error(message);
    }

    if (notify?.showSuccess ?? method !== 'GET') {
      toastSuccess(
        notify?.successTitle ?? 'Success',
        notify?.successDescription
      );
    }

    return payload;
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await apiRequest('/api/events', { method: 'GET' });
      setEvents(
        (data.events || []).map((event: any) => ({
          ...event,
          image: event?.image ? String(event.image) : '/placeholder.jpg',
        }))
      );
    } finally {
      setEventsLoading(false);
    }
  }, [apiRequest]);

  const fetchRegistrations = useCallback(async () => {
    if (!user) {
      setRegistrations([]);
      return;
    }
    const data = await apiRequest('/api/registrations', { method: 'GET' });
    const formatted = (data.registrations || []).map((r: any) => ({
      ...r,
      createdAt: r.registeredAt || r.createdAt // Ensure field exists
    }));
    setRegistrations(formatted);
  }, [apiRequest, user]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiRequest('/api/admin/users', { method: 'GET' });
      setUsers(data.users || []);
    } catch (err) {
      // Only log unexpected errors, not auth errors (401/403)
      if (err instanceof Error && !err.message.includes('Forbidden') && !err.message.includes('Unauthorized')) {
        console.error('Failed to fetch users:', err);
      }
    }
  }, [apiRequest]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, {
      successTitle: 'Signed in',
      successDescription: 'Welcome back.',
      errorTitle: 'Sign in failed',
    });
    setUser(data.user);
    await Promise.all([fetchEvents(), fetchRegistrations()]);
    return data.user as User;
  }, [apiRequest]);

  const signup = useCallback(async (name: string, email: string, password: string, role: string = 'attendee') => {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }, {
      successTitle: 'Account created',
      successDescription: 'Welcome to Startup Lab.',
      errorTitle: 'Signup failed',
    });
    setUser(data.user);
    await Promise.all([fetchEvents(), fetchRegistrations()]);
    return data.user as User;
  }, [apiRequest]);

  const logout = useCallback(async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' }, {
      successTitle: 'Logged out',
      successDescription: 'You have been signed out.',
      errorTitle: 'Logout failed',
    }).catch(() => undefined);
    setUser(null);
    setRegistrations([]);
  }, [apiRequest]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const data = await apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        email: updates.email,
        company: updates.company,
        phone: updates.phone,
        bio: updates.bio,
      }),
    }, {
      successTitle: 'Profile updated',
      successDescription: 'Your profile has been saved.',
      errorTitle: 'Update failed',
    });
    if (data?.user) {
      setUser(data.user);
    }
  }, [apiRequest]);

  const getEventById = useCallback((id: string) => {
    return events.find(e => e.id === id);
  }, [events]);

  const registerEvent = useCallback(async (eventId: string) => {
    if (!user) {
      throw new Error('You must be signed in to register for events.');
    }

    const ev = events.find(e => e.id === eventId);
    const eventTitle = ev?.title ?? 'the event';

    let alreadyRegistered = false;
    const optimisticId = `optimistic-${eventId}-${Date.now()}`;
    const optimisticRegistration: Registration = {
      id: optimisticId,
      eventId,
      userId: user.id,
      status: 'confirmed',
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setRegistrations((prev) => {
      const exists = prev.some((r) => r.eventId === eventId && r.status !== 'cancelled');
      if (exists) {
        alreadyRegistered = true;
        return prev;
      }
      return [...prev, optimisticRegistration];
    });

    if (alreadyRegistered) {
      throw new Error('You are already registered for this event.');
    }

    try {
      await apiRequest('/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      }, {
        successTitle: 'Registration confirmed',
        successDescription: `You are registered for ${eventTitle}.`,
        errorTitle: 'Registration failed',
      });
      await Promise.all([fetchEvents(), fetchRegistrations()]);
    } catch (err) {
      setRegistrations((prev) => prev.filter((r) => r.id !== optimisticId));
      throw err;
    }
  }, [apiRequest, user, fetchEvents, fetchRegistrations, events]);

  const cancelRegistration = useCallback(async (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    const ev = reg ? events.find((e) => e.id === reg.eventId) : null;
    const eventTitle = ev?.title ?? 'the event';

    await apiRequest(`/api/registrations/${registrationId}`, {
      method: 'DELETE',
    }, {
      successTitle: 'Registration cancelled',
      successDescription: `Your spot for ${eventTitle} is now open.`,
      errorTitle: 'Cancellation failed',
    });
    await Promise.all([fetchEvents(), fetchRegistrations()]);
  }, [apiRequest, fetchEvents, fetchRegistrations, registrations, events]);

  const getRegistrationsForUser = useCallback((userId: string) => {
    return registrations.filter(r => r.userId === userId);
  }, [registrations]);

  const getRegistrationsForEvent = useCallback((eventId: string) => {
    return registrations.filter(r => r.eventId === eventId);
  }, [registrations]);

  const getRegistrationByEventId = useCallback((eventId: string) => {
    return registrations.find(r => r.eventId === eventId);
  }, [registrations]);

  const isRegisteredForEvent = useCallback((eventId: string) => {
    const registration = getRegistrationByEventId(eventId);
    return Boolean(registration && registration.status !== 'cancelled');
  }, [getRegistrationByEventId]);

  const createEvent = useCallback(async (event: Omit<Event, 'id' | 'registrations'>) => {
    await apiRequest('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        totalSlots: event.totalSlots,
        availableSlots: event.availableSlots,
        image: event.image,
        status: event.status,
      }),
    }, {
      successTitle: 'Event created',
      successDescription: event.title,
      errorTitle: 'Create event failed',
    });
    await fetchEvents();
  }, [apiRequest, fetchEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    const existing = events.find((e) => e.id === id);
    const eventTitle = updates.title ?? existing?.title ?? 'Unknown event';

    await apiRequest(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        date: updates.date,
        time: updates.time,
        location: updates.location,
        totalSlots: updates.totalSlots,
        availableSlots: updates.availableSlots,
        status: updates.status,
        image: updates.image,
      }),
    }, {
      successTitle: 'Event updated',
      successDescription: String(eventTitle),
      errorTitle: 'Update event failed',
    });
    await fetchEvents();
  }, [apiRequest, fetchEvents, events]);

  const deleteEvent = useCallback(async (id: string) => {
    const existing = events.find((e) => e.id === id);
    await apiRequest(`/api/events/${id}`, { method: 'DELETE' }, {
      successTitle: 'Event archived',
      successDescription: existing?.title ?? 'Event moved to archive',
      errorTitle: 'Archive failed',
    });
    await fetchEvents();
  }, [apiRequest, fetchEvents, events]);

  const approveRegistration = useCallback(async (registrationId: string) => {
    await apiRequest(`/api/admin/registrations/${registrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    }, {
      successTitle: 'Updated',
      successDescription: 'Registration approved',
      errorTitle: 'Action failed',
    });
    await fetchRegistrations();
  }, [apiRequest, fetchRegistrations]);

  const rejectRegistration = useCallback(async (registrationId: string) => {
    await apiRequest(`/api/admin/registrations/${registrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    }, {
      successTitle: 'Updated',
      successDescription: 'Registration rejected',
      errorTitle: 'Action failed',
    });
    await fetchRegistrations();
    await fetchEvents();
  }, [apiRequest, fetchRegistrations, fetchEvents]);

  const markAttended = useCallback(async (registrationId: string) => {
    await apiRequest(`/api/admin/registrations/${registrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'attended' }),
    }, {
      successTitle: 'Updated',
      successDescription: 'Marked as attended',
      errorTitle: 'Action failed',
    });
    await fetchRegistrations();
  }, [apiRequest, fetchRegistrations]);

  React.useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const data = await apiRequest('/api/auth/me');
        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [apiRequest]);

  useEffect(() => {
    fetchEvents().catch(() => {
      /* swallow */
    });
  }, [fetchEvents]);

  useEffect(() => {
    fetchRegistrations().catch(() => {
      /* swallow */
    });
  }, [fetchRegistrations]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers().catch(() => {
        /* swallow */
      });
    }
  }, [fetchUsers, user]);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!user,
      authLoading,
      login,
      signup,
      logout,
      updateProfile,
      events,
      eventsLoading,
      registrations,
      registerEvent,
      cancelRegistration,
      getEventById,
      getRegistrationsForUser,
      getRegistrationsForEvent,
      getRegistrationByEventId,
      isRegisteredForEvent,
      createEvent,
      updateEvent,
      deleteEvent,
      approveRegistration,
      rejectRegistration,
      markAttended,
      users,
      fetchUsers,
      fetchEvents,
      fetchRegistrations,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
