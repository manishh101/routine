import React from 'react';
import useAuthStore from '../contexts/authStore';
import RoutineEditor from '../components/RoutineEditor';

const Routine = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return <RoutineEditor isAdmin={isAdmin} />;
};

export default Routine;
