import { render } from '@react-email/render';
import * as React from 'react';

export const renderEmail = async (component: React.ReactElement): Promise<string> => {
  return render(component, {
    pretty: false, // Set to true for development to see formatted HTML
  });
};

export const renderEmailText = async (component: React.ReactElement): Promise<string> => {
  return render(component, {
    plainText: true,
  });
};