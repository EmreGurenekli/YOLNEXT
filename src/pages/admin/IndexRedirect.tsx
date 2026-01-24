import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminBasePath } from '../../config/admin';

const IndexRedirect: React.FC = () => {
  return <Navigate to={`${getAdminBasePath()}/ops`} replace />;
};

export default IndexRedirect;











