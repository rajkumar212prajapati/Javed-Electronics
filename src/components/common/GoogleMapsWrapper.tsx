import React, { ReactNode } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapsWrapperProps {
  children: ReactNode;
}

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children }) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  return (
    <APIProvider
      apiKey={apiKey}
      language="en"
      region="IN"
      libraries={['places', 'geometry', 'marker', 'routes', 'geocoding']}
    >
      {children}
    </APIProvider>
  );
};
