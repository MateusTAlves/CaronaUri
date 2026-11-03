import React from 'react';
import DetalhesCarona from './DetalhesCarona';

export default function DetalhesCaronaView(props: any) {
  const ride = props.route?.params?.ride ?? props.ride;
  const canComplete = props.route?.params?.canComplete ?? false;

  return (
    <DetalhesCarona
      {...props}
      ride={ride}
      canComplete={canComplete}
      showMapActions={false}
    />
  );
}
