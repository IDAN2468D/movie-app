import React from 'react';
import Svg, { Path, Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';

interface Props {
  model: string;
  glowColor: string;
}

export function CollectiblesSvgModel({ model, glowColor }: Props) {
  if (model === 'ticket') {
    return (
      <Svg width="160" height="240" viewBox="0 0 160 240" fill="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="160" height="240" rx="20" fill="url(#glow)" />
        <Path d="M20,10 H140 A10,10 0 0,1 150,20 V90 A15,15 0 0,0 150,120 V220 A10,10 0 0,1 140,230 H20 A10,10 0 0,1 10,220 V120 A15,15 0 0,0 10,90 V20 A10,10 0 0,1 20,10 Z" fill="rgba(255, 255, 255, 0.08)" stroke={glowColor} strokeWidth="2.5" />
        <Path d="M30,30 V210 M130,30 V210" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="5,5" />
        <Path d="M50,120 H110" stroke={glowColor} strokeWidth="3" />
      </Svg>
    );
  } else if (model === 'projector') {
    return (
      <Svg width="160" height="240" viewBox="0 0 160 240" fill="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="160" height="240" rx="20" fill="url(#glow)" />
        <Path d="M30,80 H100 V140 H30 Z" fill="rgba(255,255,255,0.08)" stroke={glowColor} strokeWidth="2.5" />
        <Path d="M100,100 L130,80 V140 L100,120 Z" fill="rgba(255,255,255,0.04)" stroke={glowColor} strokeWidth="2" />
        <Circle cx="45" cy="50" r="22" stroke="white" strokeWidth="2" fill="none" />
        <Circle cx="85" cy="50" r="22" stroke="white" strokeWidth="2" fill="none" />
      </Svg>
    );
  }
  return (
    <Svg width="160" height="240" viewBox="0 0 160 240" fill="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="160" height="240" rx="20" fill="url(#glow)" />
      <Path d="M40,90 L50,210 H110 L120,90 Z" fill="rgba(255,255,255,0.08)" stroke={glowColor} strokeWidth="2.5" />
      <Path d="M60,90 L67,210 M80,90 L80,210 M100,90 L93,210" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <Path d="M35,90 C35,80 50,70 60,80 C70,70 80,75 90,80 C100,70 115,75 125,90 Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
    </Svg>
  );
}
