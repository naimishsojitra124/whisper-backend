import { render } from '@react-email/render';
import React from 'react';

export async function renderEmail(component: React.ReactElement): Promise<string> {
  return await render(component, {
    pretty: true
  });
}
